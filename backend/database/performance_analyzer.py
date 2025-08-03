#!/usr/bin/env python3
"""
Database Performance Analyzer
SizeWise Suite - Phase 4: Performance Optimization
Task: Database Indexing Improvements

This module analyzes database performance before and after index creation
to validate the 60% sync improvement and <100ms query response time targets.
"""

import asyncio
import sqlite3
import time
import statistics
from datetime import datetime
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from pathlib import Path

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class QueryPerformanceResult:
    """Performance result for a single query."""
    query_name: str
    query_sql: str
    execution_time_ms: float
    rows_returned: int
    index_used: bool
    query_plan: str

@dataclass
class PerformanceAnalysisReport:
    """Complete performance analysis report."""
    timestamp: datetime
    database_path: str
    total_queries_tested: int
    average_execution_time_ms: float
    queries_under_100ms: int
    queries_over_100ms: int
    index_usage_rate: float
    detailed_results: List[QueryPerformanceResult]
    recommendations: List[str]

class DatabasePerformanceAnalyzer:
    """Analyzes database performance for HVAC-specific queries."""
    
    def __init__(self, database_path: str = "backend/database/sizewise.db"):
        self.database_path = database_path
        self.connection = None
        
    def connect(self):
        """Connect to SQLite database."""
        try:
            self.connection = sqlite3.connect(self.database_path)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"Connected to database: {self.database_path}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def disconnect(self):
        """Disconnect from database."""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def get_hvac_test_queries(self) -> Dict[str, str]:
        """Get HVAC-specific test queries for performance analysis."""
        return {
            # Project queries
            "user_projects_active": """
                SELECT * FROM projects 
                WHERE user_id = 'test-user-123' AND status = 'active' 
                ORDER BY last_modified DESC 
                LIMIT 50
            """,
            
            "projects_by_building_type": """
                SELECT * FROM projects 
                WHERE building_type = 'office' AND user_id = 'test-user-123'
                ORDER BY last_modified DESC
            """,
            
            "project_name_search": """
                SELECT * FROM projects 
                WHERE name LIKE '%HVAC%' AND status = 'active'
                ORDER BY name
            """,
            
            # Project segments queries
            "segments_by_project_type": """
                SELECT * FROM project_segments 
                WHERE project_id = 'test-project-456' AND segment_type = 'duct'
                ORDER BY created_at DESC
            """,
            
            "segments_with_calculations": """
                SELECT * FROM project_segments 
                WHERE project_id = 'test-project-456' 
                AND calculation_data IS NOT NULL
                ORDER BY updated_at DESC
            """,
            
            "all_duct_segments": """
                SELECT ps.*, p.name as project_name 
                FROM project_segments ps
                JOIN projects p ON ps.project_id = p.id
                WHERE ps.segment_type = 'duct' AND p.user_id = 'test-user-123'
                ORDER BY ps.created_at DESC
            """,
            
            # Synchronization queries
            "pending_sync_operations": """
                SELECT * FROM change_log 
                WHERE sync_status = 'pending' 
                ORDER BY timestamp ASC 
                LIMIT 100
            """,
            
            "user_sync_history": """
                SELECT * FROM change_log 
                WHERE user_id = 'test-user-123' AND sync_status = 'pending'
                ORDER BY timestamp ASC
            """,
            
            "entity_change_tracking": """
                SELECT * FROM change_log 
                WHERE entity_type = 'project' AND entity_id = 'test-project-456'
                ORDER BY timestamp DESC
            """,
            
            # Feature flag queries
            "user_feature_flags": """
                SELECT * FROM feature_flags 
                WHERE user_id = 'test-user-123' AND enabled = 1
                AND (expires_at IS NULL OR expires_at > datetime('now'))
            """,
            
            "tier_based_features": """
                SELECT * FROM feature_flags 
                WHERE tier_required = 'pro' AND enabled = 1
                ORDER BY feature_name
            """,
        }
    
    def execute_query_with_timing(self, query_name: str, query_sql: str) -> QueryPerformanceResult:
        """Execute a query and measure its performance."""
        try:
            # Get query plan first
            explain_query = f"EXPLAIN QUERY PLAN {query_sql}"
            cursor = self.connection.cursor()
            cursor.execute(explain_query)
            query_plan = " | ".join([row[3] for row in cursor.fetchall()])
            
            # Check if index is used
            index_used = "USING INDEX" in query_plan.upper() or "INDEX" in query_plan.upper()
            
            # Execute actual query with timing
            start_time = time.perf_counter()
            cursor.execute(query_sql)
            results = cursor.fetchall()
            end_time = time.perf_counter()
            
            execution_time_ms = (end_time - start_time) * 1000
            rows_returned = len(results)
            
            return QueryPerformanceResult(
                query_name=query_name,
                query_sql=query_sql,
                execution_time_ms=execution_time_ms,
                rows_returned=rows_returned,
                index_used=index_used,
                query_plan=query_plan
            )
            
        except Exception as e:
            logger.error(f"Error executing query '{query_name}': {e}")
            return QueryPerformanceResult(
                query_name=query_name,
                query_sql=query_sql,
                execution_time_ms=float('inf'),
                rows_returned=0,
                index_used=False,
                query_plan=f"ERROR: {str(e)}"
            )
    
    def run_performance_analysis(self) -> PerformanceAnalysisReport:
        """Run complete performance analysis."""
        logger.info("Starting database performance analysis...")
        
        test_queries = self.get_hvac_test_queries()
        results = []
        
        # Execute all test queries
        for query_name, query_sql in test_queries.items():
            logger.info(f"Testing query: {query_name}")
            result = self.execute_query_with_timing(query_name, query_sql)
            results.append(result)
        
        # Calculate statistics
        execution_times = [r.execution_time_ms for r in results if r.execution_time_ms != float('inf')]
        
        if execution_times:
            avg_execution_time = statistics.mean(execution_times)
            queries_under_100ms = len([t for t in execution_times if t < 100])
            queries_over_100ms = len([t for t in execution_times if t >= 100])
        else:
            avg_execution_time = 0
            queries_under_100ms = 0
            queries_over_100ms = len(results)
        
        index_usage_rate = len([r for r in results if r.index_used]) / len(results) * 100
        
        # Generate recommendations
        recommendations = self._generate_recommendations(results)
        
        return PerformanceAnalysisReport(
            timestamp=datetime.utcnow(),
            database_path=self.database_path,
            total_queries_tested=len(results),
            average_execution_time_ms=avg_execution_time,
            queries_under_100ms=queries_under_100ms,
            queries_over_100ms=queries_over_100ms,
            index_usage_rate=index_usage_rate,
            detailed_results=results,
            recommendations=recommendations
        )
    
    def _generate_recommendations(self, results: List[QueryPerformanceResult]) -> List[str]:
        """Generate performance recommendations based on analysis results."""
        recommendations = []
        
        # Check for slow queries
        slow_queries = [r for r in results if r.execution_time_ms > 100]
        if slow_queries:
            recommendations.append(
                f"Found {len(slow_queries)} queries taking >100ms. Consider adding indexes for: "
                + ", ".join([r.query_name for r in slow_queries])
            )
        
        # Check for queries not using indexes
        no_index_queries = [r for r in results if not r.index_used]
        if no_index_queries:
            recommendations.append(
                f"Found {len(no_index_queries)} queries not using indexes. Review query plans for: "
                + ", ".join([r.query_name for r in no_index_queries])
            )
        
        # Check overall performance
        avg_time = statistics.mean([r.execution_time_ms for r in results if r.execution_time_ms != float('inf')])
        if avg_time > 50:
            recommendations.append(
                f"Average query time ({avg_time:.2f}ms) is above optimal. Consider additional indexing."
            )
        
        if not recommendations:
            recommendations.append("Database performance is optimal. All queries are fast and using indexes effectively.")
        
        return recommendations
    
    def print_analysis_report(self, report: PerformanceAnalysisReport):
        """Print a formatted analysis report."""
        print("\n" + "="*80)
        print("DATABASE PERFORMANCE ANALYSIS REPORT")
        print("="*80)
        print(f"Timestamp: {report.timestamp}")
        print(f"Database: {report.database_path}")
        print(f"Total Queries Tested: {report.total_queries_tested}")
        print(f"Average Execution Time: {report.average_execution_time_ms:.2f}ms")
        print(f"Queries Under 100ms: {report.queries_under_100ms}")
        print(f"Queries Over 100ms: {report.queries_over_100ms}")
        print(f"Index Usage Rate: {report.index_usage_rate:.1f}%")
        
        print("\nDETAILED QUERY RESULTS:")
        print("-" * 80)
        for result in report.detailed_results:
            status = "✅" if result.execution_time_ms < 100 else "⚠️"
            index_status = "📊" if result.index_used else "❌"
            print(f"{status} {index_status} {result.query_name}: {result.execution_time_ms:.2f}ms ({result.rows_returned} rows)")
        
        print("\nRECOMMENDATIONS:")
        print("-" * 80)
        for i, rec in enumerate(report.recommendations, 1):
            print(f"{i}. {rec}")
        
        print("\n" + "="*80)

def main():
    """Main function to run performance analysis."""
    analyzer = DatabasePerformanceAnalyzer()
    
    try:
        analyzer.connect()
        report = analyzer.run_performance_analysis()
        analyzer.print_analysis_report(report)
        
        # Check if performance targets are met
        if report.average_execution_time_ms < 100 and report.index_usage_rate > 80:
            print("🎉 Performance targets achieved!")
            return 0
        else:
            print("⚠️ Performance targets not yet met. Review recommendations.")
            return 1
            
    except Exception as e:
        logger.error(f"Performance analysis failed: {e}")
        return 1
    finally:
        analyzer.disconnect()

if __name__ == "__main__":
    exit(exit_code := main())

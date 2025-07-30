"use client";







import React, { useState, useEffect } from 'react';



import { usePathname } from 'next/navigation';



import { ProjectPropertiesPanel, ProjectPropertiesTrigger } from '../ui/ProjectPropertiesPanel';



import { useProjectStore } from '@/stores/project-store';



import { useDeviceDetection } from '@/lib/hooks/useDeviceDetection';







// =============================================================================



// Types



// =============================================================================







interface ProjectInfo {



  name: string;



  number: string;



<<<<<<<
  description: string;

=======
/**

 * ProjectPropertiesManager - Unified, context-aware project properties panel

 * 

 * Features:

 * - Only shows when a project is loaded

 * - Route-aware visibility (only on relevant pages)

 * - Device-aware (hidden on mobile)

 * - Integrates with project store

 * - Consistent UI patterns

 */

export const ProjectPropertiesManager: React.FC<ProjectPropertiesManagerProps> = ({

  className

}) => {

  const pathname = usePathname();

  const { capabilities, getDeviceCategory } = useDeviceDetection();

  const type = getDeviceCategory();

  const { currentProject, updateProject, loadProject } = useProjectStore();

  

  // Local state

  const [showPanel, setShowPanel] = useState(false);

  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(convertProjectToInfo(null));

  const [codeStandards, setCodeStandards] = useState<CodeStandards>(convertCodesToStandards());

  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults>(createDefaultGlobalDefaults());

>>>>>>>


  location: string;



  clientName: string;



  estimatorName: string;



<<<<<<<
  dateCreated: string;

=======
  /**

   * Check if panel should be visible based on all conditions

   */

  const isPanelAvailable = (

    shouldShowOnRoute &&           // On relevant route

    currentProject !== null &&     // Project is loaded

    (type === 'tablet' || type === 'desktop')    // Device can access tools (tablet/desktop)

  );

>>>>>>>


  lastModified: string;



  version: string;



}







interface CodeStandards {



  smacna: boolean;



  ashrae: boolean;



  ul: boolean;



  imc: boolean;



  nfpa: boolean;



}







interface GlobalDefaults {



  units: 'Imperial' | 'Metric';



  defaultDuctSize: { width: number; height: number };



  defaultMaterial: string;



  defaultInsulation: string;



  defaultFitting: string;



  calibrationMode: 'Auto' | 'Manual';



  defaultVelocity: number;



  pressureClass: string;



  altitude: number;



  frictionRate: number;



}







interface ProjectPropertiesManagerProps {



  className?: string;



}







// =============================================================================



// Route Configuration



// =============================================================================







// Routes where Project Properties Panel should be available



const PROJECT_PANEL_ROUTES = [



  '/air-duct-sizer-v1',



  '/air-duct-sizer',



  '/combustion-vent-sizer',



  '/grease-duct-sizer',



  '/generator-exhaust-sizer',



  '/estimating',



  '/projects',



  '/project-management'



];







// Routes where panel should show trigger button (tool pages)



const TOOL_ROUTES = [



  '/air-duct-sizer-v1',



  '/air-duct-sizer',



  '/combustion-vent-sizer',



  '/grease-duct-sizer',



  '/generator-exhaust-sizer',



  '/estimating'



];







// =============================================================================



// Utility Functions



// =============================================================================







/**



 * Convert project store data to ProjectInfo format



 */



const convertProjectToInfo = (project: any): ProjectInfo => {



  return {



    name: project?.project_name || 'Untitled Project',



    number: project?.id?.split('-')[1] || '001',



    description: project?.description || '',



    location: project?.project_location || '',



    clientName: project?.client_name || '',



    estimatorName: project?.estimator_name || '',



    dateCreated: project?.created_at || new Date().toISOString(),



    lastModified: project?.last_modified || new Date().toISOString(),



    version: project?.version || '1.0'



  };



};







/**



 * Convert project codes to CodeStandards format



 */



const convertCodesToStandards = (codes: string[] = []): CodeStandards => {



  return {



    smacna: codes.includes('SMACNA'),



    ashrae: codes.includes('ASHRAE'),



    ul: codes.includes('UL'),



    imc: codes.includes('IMC'),



    nfpa: codes.includes('NFPA')



  };



};







/**



 * Create default global defaults



 */



const createDefaultGlobalDefaults = (): GlobalDefaults => {



  return {



    units: 'Imperial',



    defaultDuctSize: { width: 12, height: 8 },



    defaultMaterial: 'Galvanized Steel',



    defaultInsulation: 'None',



    defaultFitting: 'Standard',



    calibrationMode: 'Auto',



    defaultVelocity: 1000,



    pressureClass: "2",



    altitude: 0,



    frictionRate: 0.1



  };



};







// =============================================================================



// Main Component



// =============================================================================







/**



 * ProjectPropertiesManager - Unified, context-aware project properties panel



 * 



 * Features:



 * - Only shows when a project is loaded



 * - Route-aware visibility (only on relevant pages)



 * - Device-aware (hidden on mobile)



 * - Integrates with project store



 * - Consistent UI patterns



 */



export const ProjectPropertiesManager: React.FC<ProjectPropertiesManagerProps> = ({



  className



}) => {



  const pathname = usePathname();



  const { capabilities } = useDeviceDetection();



  const { currentProject, updateProject, loadProject } = useProjectStore();



  



  // Local state



  const [showPanel, setShowPanel] = useState(false);



  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(convertProjectToInfo(null));



  const [codeStandards, setCodeStandards] = useState<CodeStandards>(convertCodesToStandards());



  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults>(createDefaultGlobalDefaults());







  // =============================================================================



  // Visibility Logic



  // =============================================================================







  /**



   * Determine if panel should be available on current route



   */



  const shouldShowOnRoute = PROJECT_PANEL_ROUTES.some(route => 



    pathname.startsWith(route)



  );







  /**



   * Determine if trigger button should be shown (tool pages)



   */



  const shouldShowTrigger = TOOL_ROUTES.some(route => 



    pathname.startsWith(route)



  );







  /**



   * Check if panel should be visible based on all conditions



   */



  const isPanelAvailable = (



    shouldShowOnRoute &&           // On relevant route



    currentProject !== null &&     // Project is loaded



    capabilities.canAccessTools    // Device can access tools (tablet/desktop)



  );







  // =============================================================================



  // Effects



  // =============================================================================







  /**



   * Create a demo project if none exists (for development)



   */



  useEffect(() => {



    if (!currentProject && typeof window !== 'undefined') {



      // Create a demo project for testing



      const demoProject = {



        id: 'demo-project-001',



        project_name: 'Demo HVAC Project',



        project_location: 'Demo Building',



        description: 'Sample project for testing Project Properties Panel',



        client_name: 'Demo Client',



        estimator_name: 'Demo User',



        codes: ['SMACNA', 'ASHRAE'],



        rooms: [],



        segments: [],



        equipment: [],



        created_at: new Date().toISOString(),



        last_modified: new Date().toISOString(),



        version: '1.0'



      };







      // Load the demo project



      setTimeout(() => {



        loadProject(demoProject);



      }, 100);



    }



  }, [currentProject, loadProject]);







  /**



   * Update local state when project changes



   */



  useEffect(() => {



    if (currentProject) {



      setProjectInfo(convertProjectToInfo(currentProject));



      setCodeStandards(convertCodesToStandards(currentProject.codes));



    }



  }, [currentProject]);







  /**



   * Handle keyboard shortcuts



   */



  useEffect(() => {



    if (!isPanelAvailable) return;







    const handleKeyDown = (event: KeyboardEvent) => {



      // Ctrl/Cmd + P to toggle panel



      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {



        event.preventDefault();



        setShowPanel(!showPanel);



      }



      



      // Escape to close panel



      if (event.key === 'Escape' && showPanel) {



        setShowPanel(false);



      }



    };







    document.addEventListener('keydown', handleKeyDown);



    return () => document.removeEventListener('keydown', handleKeyDown);



  }, [isPanelAvailable, showPanel]);







  // =============================================================================



  // Event Handlers



  // =============================================================================







  const handleProjectInfoChange = (updates: Partial<ProjectInfo>) => {



    const updatedInfo = { ...projectInfo, ...updates };



    setProjectInfo(updatedInfo);



    



    // Update project store



    if (currentProject) {



      updateProject({



        project_name: updatedInfo.name,



        project_location: updatedInfo.location,



        contractor_name: updatedInfo.clientName || updatedInfo.estimatorName,



        user_name: updatedInfo.estimatorName



      });



    }



  };







  const handleCodeStandardsChange = (updates: Partial<CodeStandards>) => {



    const updatedStandards = { ...codeStandards, ...updates };



    setCodeStandards(updatedStandards);



    



    // Convert back to codes array



    const codes: string[] = [];



    if (updatedStandards.smacna) codes.push('SMACNA');



    if (updatedStandards.ashrae) codes.push('ASHRAE');



    if (updatedStandards.ul) codes.push('UL');



    if (updatedStandards.imc) codes.push('IMC');



    if (updatedStandards.nfpa) codes.push('NFPA');



    



    // Update project store



    if (currentProject) {



      updateProject({ codes });



    }



  };







  const handleGlobalDefaultsChange = (updates: Partial<GlobalDefaults>) => {



    setGlobalDefaults({ ...globalDefaults, ...updates });



    // Note: Global defaults might be stored separately in the future



  };







  // =============================================================================



  // Render



  // =============================================================================







  // Don't render anything if panel is not available



  if (!isPanelAvailable) {



    return null;



  }







  return (



    <>



      {/* Trigger Button (for tool pages) */}



      {shouldShowTrigger && (



        <ProjectPropertiesTrigger



          onClick={() => setShowPanel(true)}



          isActive={showPanel}



          className={`z-50 ${className}`} // Higher z-index to be above navigation



        />



      )}







      {/* Project Properties Panel */}



      <ProjectPropertiesPanel



        isOpen={showPanel}



        onClose={() => setShowPanel(false)}



        projectInfo={projectInfo}



        codeStandards={codeStandards}



        globalDefaults={globalDefaults}



        onProjectInfoChange={handleProjectInfoChange}



        onCodeStandardsChange={handleCodeStandardsChange}



        onGlobalDefaultsChange={handleGlobalDefaultsChange}



      />



    </>



  );



};




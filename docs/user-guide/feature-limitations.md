# SizeWise Suite - Feature Limitations Guide

**Understanding tier restrictions and how to work within them**

> **Note:** The first offline release includes only the Air Duct Sizer module. Boiler vent, grease duct, and other calculators will be added later.

---

## 🆓 Free Tier Limitations

### Project Limitations

#### 3-Project Maximum
**What this means:**
- You can create and maintain up to 3 projects simultaneously
- Once you reach 3 projects, you must delete an existing project to create a new one
- Deleted projects cannot be recovered in Free tier

**Working within this limit:**
- ✅ **Focus on active projects**: Keep only projects you're actively working on
- ✅ **Export before deleting**: Save PDF reports of completed projects before deletion
- ✅ **Use descriptive names**: Make it easy to identify which projects to keep
- ✅ **Archive completed work**: Export project data as CSV for future reference

**When you'll hit this limit:**
- Small residential projects: After 3 homes
- Commercial projects: After 2-3 buildings
- Learning/practice: After several tutorial projects

**Upgrade prompt appears when:**
- Attempting to create a 4th project
- Project count reaches 3/3 in the dashboard

#### 25 Segments per Project Maximum
**What this means:**
- Each project can contain up to 25 duct segments, fittings, or equipment pieces
- Complex systems may require multiple projects to design completely
- Segment count includes all ductwork components

**Working within this limit:**
- ✅ **Break large systems into zones**: Create separate projects for each floor or zone
- ✅ **Focus on critical paths**: Design main distribution first, details later
- ✅ **Use representative segments**: Model typical runs rather than every branch
- ✅ **Combine similar segments**: Group identical duct runs into single calculations

**Typical segment usage:**
- Residential home: 8-15 segments
- Small office: 15-25 segments
- Large commercial: 50+ segments (requires multiple projects or Pro upgrade)

**Upgrade prompt appears when:**
- Attempting to add a 26th segment
- Segment count reaches 25/25 in project view

### Export Limitations

#### Watermarked PDF Reports
**What this means:**
- All PDF exports include "SizeWise Suite - Upgrade to Pro" watermark
- Watermark appears on every page of the report
- Professional presentation may be impacted

**Working with watermarks:**
- ✅ **Internal use**: Perfect for internal calculations and reviews
- ✅ **Draft presentations**: Use for initial client discussions
- ✅ **Learning**: Ideal for educational and training purposes
- ❌ **Final deliverables**: May not be suitable for final client presentations

**Watermark placement:**
- Footer of every page
- Semi-transparent overlay
- Does not obscure calculation data

#### Standard Resolution Only
**What this means:**
- PDF exports are limited to 150 DPI resolution
- Suitable for screen viewing and standard printing
- May appear less crisp when printed at large sizes

**Resolution comparison:**
- Free tier: 150 DPI (standard quality)
- Pro tier: 300 DPI (high resolution)
- Print quality: 150 DPI adequate for 8.5x11" prints

### Feature Access Limitations

#### Air Duct Sizer Only
**What's included:**
- ✅ Complete air duct sizing calculations
- ✅ SMACNA standard compliance checking
- ✅ Pressure drop calculations
- ✅ Velocity and airflow calculations

**What's not included:**
- ❌ Boiler vent sizing
- ❌ Grease duct calculations
- ❌ General ventilation calculations
- ❌ Equipment selection tools

**When you'll need more tools:**
- Kitchen exhaust systems (grease ducts)
- Boiler and water heater venting
- Industrial ventilation systems
- HVAC equipment selection

#### Limited 3D Visualization
**What's included:**
- ✅ Basic 3D wireframe view
- ✅ Simple duct routing visualization
- ✅ Basic collision detection

**What's limited:**
- ❌ Advanced materials and textures
- ❌ Photorealistic rendering
- ❌ Advanced lighting and shadows
- ❌ High-resolution 3D exports

#### No Cloud Features
**What this means:**
- All data stored locally on your device
- No automatic backup to cloud
- No multi-device synchronization
- No project sharing capabilities

**Backup recommendations:**
- ✅ **Manual backups**: Regularly copy project files
- ✅ **Export important data**: Save PDFs and CSV files
- ✅ **Multiple locations**: Store backups on external drives
- ✅ **Version control**: Keep dated copies of important projects

---

## 🚀 Pro Tier Limitations

### What's Unlimited in Pro
- ✅ **Projects**: Create unlimited projects
- ✅ **Segments**: No limit on segments per project
- ✅ **HVAC Tools**: Access to all calculation tools
- ✅ **Export Quality**: High-resolution, watermark-free exports
- ✅ **Cloud Storage**: Unlimited cloud backup and sync

### Remaining Limitations

#### Basic Team Collaboration
**What's included:**
- ✅ Project sharing with view-only access
- ✅ Basic project comments and notes
- ✅ Simple version history

**What's limited:**
- ❌ Role-based access control
- ❌ Advanced permission management
- ❌ Real-time collaborative editing
- ❌ Organization-wide user management

#### Standard Templates Only
**What's included:**
- ✅ Built-in project templates
- ✅ Standard report formats
- ✅ Default calculation settings

**What's not included:**
- ❌ Custom company templates
- ❌ Branded report templates
- ❌ Organization-specific standards
- ❌ Custom calculation defaults

#### Limited Integration
**What's included:**
- ✅ DXF/DWG export for CAD programs
- ✅ CSV data export
- ✅ Standard PDF reports

**What's not included:**
- ❌ BIM integration (Revit, IFC)
- ❌ API access for custom integrations
- ❌ Advanced data exchange formats
- ❌ Third-party software plugins

---

## 🏢 Enterprise Tier - Minimal Limitations

### What's Unlimited in Enterprise
- ✅ **All Pro features** without restrictions
- ✅ **Advanced collaboration** with full RBAC
- ✅ **Custom branding** and templates
- ✅ **BIM integration** and API access
- ✅ **Priority support** with dedicated account manager

### Potential Limitations

#### Custom Development
**What's included:**
- ✅ Standard API access
- ✅ Common integration patterns
- ✅ Standard customization options

**What may require additional work:**
- ❌ Highly specialized integrations
- ❌ Custom calculation engines
- ❌ Proprietary data format support
- ❌ Unique workflow requirements

*Note: Custom development available through professional services*

---

## 🔄 Working Around Limitations

### Free Tier Workarounds

#### Managing the 3-Project Limit
**Strategy 1: Project Rotation**
```
Active Projects (3/3):
├── Current Commercial Project (in progress)
├── Residential Project A (final review)
└── Learning Project (practice)

When starting new work:
1. Export Residential Project A as PDF
2. Delete Residential Project A
3. Create new project
```

**Strategy 2: Zone-Based Design**
```
Large Building Project:
├── Project 1: "Building A - HVAC Zone 1-3"
├── Project 2: "Building A - HVAC Zone 4-6"
└── Project 3: "Building A - Equipment Selection"
```

#### Managing the 25-Segment Limit
**Strategy 1: System Breakdown**
```
Complex System (60 segments total):
├── Project 1: "Main Distribution" (20 segments)
├── Project 2: "Floor 1 Branches" (25 segments)
└── Project 3: "Floor 2 Branches" (15 segments)
```

**Strategy 2: Representative Modeling**
```
Instead of modeling every duct:
├── Model main trunk lines
├── Model typical branch patterns
├── Use calculations to size similar branches
└── Document variations in notes
```

### Pro Tier Optimization

#### Maximizing Team Collaboration
**Best Practices:**
- ✅ Use clear project naming conventions
- ✅ Add detailed project descriptions
- ✅ Utilize comment features for communication
- ✅ Maintain version history with meaningful names

#### Template Management
**Workarounds for custom templates:**
- ✅ Create "template projects" to copy from
- ✅ Document standard settings in project notes
- ✅ Use consistent naming and organization
- ✅ Share template projects with team members

---

## 📈 When to Upgrade

### Free to Pro Upgrade Triggers

**Project Management:**
- ❌ Constantly hitting 3-project limit
- ❌ Need to design systems with 25+ segments
- ❌ Require professional presentations without watermarks
- ❌ Need cloud backup and multi-device access

**Professional Requirements:**
- ❌ Client presentations require watermark-free reports
- ❌ Need high-resolution prints for large format drawings
- ❌ Require additional HVAC calculation tools
- ❌ Need CAD integration with DXF/DWG export

**Workflow Efficiency:**
- ❌ Spending too much time managing project limits
- ❌ Need to work from multiple devices
- ❌ Require automatic cloud backup
- ❌ Need to share projects with colleagues

### Pro to Enterprise Upgrade Triggers

**Team Collaboration:**
- ❌ Need role-based access control
- ❌ Require organization-wide user management
- ❌ Need advanced project permissions
- ❌ Require real-time collaborative editing

**Professional Presentation:**
- ❌ Need custom company branding
- ❌ Require organization-specific templates
- ❌ Need custom report formats
- ❌ Require professional client presentations

**Integration Requirements:**
- ❌ Need BIM integration (Revit, IFC)
- ❌ Require API access for custom integrations
- ❌ Need advanced data exchange capabilities
- ❌ Require compliance and audit features

---

## 💡 Tips for Success

### Free Tier Success Tips
1. **Plan your projects carefully** - Know what you want to accomplish before starting
2. **Export regularly** - Save important work before deleting projects
3. **Use segments efficiently** - Focus on critical design elements
4. **Learn the tools thoroughly** - Maximize the value of available features

### Pro Tier Success Tips
1. **Organize projects systematically** - Use clear naming and folder structures
2. **Leverage cloud features** - Take advantage of multi-device access
3. **Share strategically** - Use project sharing for client collaboration
4. **Plan for growth** - Consider Enterprise features for future needs

### Enterprise Tier Success Tips
1. **Implement gradually** - Roll out features systematically across your organization
2. **Train thoroughly** - Ensure all users understand advanced features
3. **Customize thoughtfully** - Set up templates and branding to match your workflow
4. **Integrate strategically** - Plan API and BIM integrations carefully

---

## 🆘 Getting Help

### Understanding Your Limits
**Check current usage:**
- Project count: Visible in main dashboard
- Segment count: Shown in project view
- Feature availability: Indicated by upgrade prompts

**Need clarification?**
- 📚 Review feature comparison charts
- 🎥 Watch tier overview videos
- 💬 Ask in community forums
- 📧 Contact support for specific questions

### Upgrade Assistance
**Ready to upgrade?**
- 🚀 In-app upgrade for immediate activation
- 📞 Call sales for guidance and questions
- 💬 Live chat for quick answers
- 📧 Email for detailed upgrade planning

---

**Remember:** Every limitation in lower tiers is designed to provide value while encouraging growth. As your needs expand, SizeWise Suite grows with you!

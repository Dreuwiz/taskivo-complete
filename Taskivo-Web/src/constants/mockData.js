export const INIT_USERS = [
  {id:1, name:"Alice Santos", role:"user",        team:"Alpha", avatar:"AS", streak:4,  email:"alice@taskivo.com", status:"Active"  },
  {id:2, name:"Ben Cruz",     role:"user",        team:"Alpha", avatar:"BC", streak:7,  email:"ben@taskivo.com",   status:"Active"  },
  {id:3, name:"Carla Reyes",  role:"user",        team:"Beta",  avatar:"CR", streak:12, email:"carla@taskivo.com", status:"Active"  },
  {id:4, name:"Mia Vega",     role:"user",        team:"Beta",  avatar:"MV", streak:1,  email:"mia@taskivo.com",   status:"Inactive"},
  {id:5, name:"Dan Lim",      role:"team_leader", team:"Alpha", avatar:"DL", streak:9,  email:"dan@taskivo.com",   status:"Active"  },
  {id:6, name:"Eva Tan",      role:"team_leader", team:"Beta",  avatar:"ET", streak:5,  email:"eva@taskivo.com",   status:"Active"  },
  {id:7, name:"Frank Ong",    role:"manager",     team:null,    avatar:"FO", streak:3,  email:"frank@taskivo.com", status:"Active"  },
  {id:8, name:"Grace Ko",     role:"admin",       team:null,    avatar:"GK", streak:14, email:"grace@taskivo.com", status:"Active"  },
];

export const INIT_TASKS = [
  {
    id:1, title:"Update project documentation",
    description:"Review and update all technical documentation including API references, setup guides, and changelog entries to reflect the latest version changes.",
    assignedTo:"Alice Santos", team:"Alpha", status:"In Progress", priority:"High", due:"2026-03-15",
    subtasks:[
      { id:101, title:"Review existing docs for outdated content", done:true  },
      { id:102, title:"Update API reference section",             done:true  },
      { id:103, title:"Write changelog entries",                  done:false },
      { id:104, title:"Get team lead approval",                   done:false },
    ],
  },
  {
    id:2, title:"Fix login page bug",
    description:"Users are reporting a blank screen after entering credentials on certain browsers. Investigate and patch the authentication flow.",
    assignedTo:"Ben Cruz", team:"Alpha", status:"Completed", priority:"Critical", due:"2026-03-13",
    subtasks:[
      { id:201, title:"Reproduce the bug on Chrome and Edge", done:true },
      { id:202, title:"Identify root cause in auth handler",  done:true },
      { id:203, title:"Apply patch and write unit test",      done:true },
      { id:204, title:"Deploy fix to staging",                done:true },
    ],
  },
  {
    id:3, title:"Conduct code review",
    description:"Perform a thorough review of pull requests submitted this sprint. Focus on code quality, naming conventions, and test coverage.",
    assignedTo:"Dan Lim", team:"Alpha", status:"In Progress", priority:"Medium", due:"2026-03-14",
    subtasks:[
      { id:301, title:"Review PR #42 — auth refactor",    done:true  },
      { id:302, title:"Review PR #43 — dashboard widgets",done:false },
      { id:303, title:"Leave comments and request changes",done:false },
    ],
  },
  {
    id:4, title:"Design dashboard mockup",
    description:"Create high-fidelity wireframes for the new analytics dashboard. Include mobile and desktop breakpoints. Share with stakeholders for feedback.",
    assignedTo:"Carla Reyes", team:"Beta", status:"Completed", priority:"High", due:"2026-03-12",
    subtasks:[
      { id:401, title:"Sketch low-fidelity layout",        done:true },
      { id:402, title:"Build desktop mockup in Figma",     done:true },
      { id:403, title:"Build mobile mockup in Figma",      done:true },
      { id:404, title:"Present to stakeholders",           done:true },
    ],
  },
  {
    id:5, title:"Q1 report compilation",
    description:"Compile all Q1 performance data including task completion rates, team velocity, and SLA adherence. Export as PDF and share with management.",
    assignedTo:"Eva Tan", team:"Beta", status:"Pending", priority:"Critical", due:"2026-03-16",
    subtasks:[
      { id:501, title:"Gather data from all team leads",   done:false },
      { id:502, title:"Compile into report template",      done:false },
      { id:503, title:"Review with Frank Ong",             done:false },
      { id:504, title:"Export and distribute PDF",         done:false },
    ],
  },
  {
    id:6, title:"Onboard new team members",
    description:"Prepare onboarding materials and conduct orientation sessions for the two new Beta team members joining this month.",
    assignedTo:"Mia Vega", team:"Beta", status:"Pending", priority:"Medium", due:"2026-03-18",
    subtasks:[
      { id:601, title:"Prepare welcome pack and credentials", done:false },
      { id:602, title:"Schedule orientation session",         done:false },
      { id:603, title:"Assign buddy mentors",                 done:false },
    ],
  },
  {
    id:7, title:"Department performance review",
    description:"Run the quarterly performance review process for all department employees. Collect self-assessments, manager evaluations, and compile final scores.",
    assignedTo:"Frank Ong", team:null, status:"In Progress", priority:"High", due:"2026-03-19",
    subtasks:[
      { id:701, title:"Send self-assessment forms",          done:true  },
      { id:702, title:"Collect manager evaluations",         done:true  },
      { id:703, title:"Compile and normalize scores",        done:false },
      { id:704, title:"Conduct 1:1 review meetings",         done:false },
    ],
  },
  {
    id:8, title:"System-wide security audit",
    description:"Perform a comprehensive security audit covering access control, data encryption, dependency vulnerabilities, and compliance with internal security policy.",
    assignedTo:"Grace Ko", team:null, status:"Pending", priority:"Low", due:"2026-03-22",
    subtasks:[
      { id:801, title:"Audit user access and role permissions", done:false },
      { id:802, title:"Run dependency vulnerability scan",      done:false },
      { id:803, title:"Review encryption at rest and in transit",done:false},
      { id:804, title:"Write audit report",                     done:false },
    ],
  },
];

export const INIT_AUDIT = [
  {time:"2 min ago",  user:"Grace Ko",  action:"Deleted user Mia Vega",                  type:"danger" },
  {time:"15 min ago", user:"Frank Ong", action:"Reassigned task to Eva Tan",             type:"info"   },
  {time:"1 hr ago",   user:"Dan Lim",   action:"Marked task as completed",               type:"success"},
  {time:"3 hrs ago",  user:"Grace Ko",  action:"Added new user Ben Cruz",                type:"success"},
  {time:"Yesterday",  user:"Frank Ong", action:"Changed Alice Santos role → User/Staff", type:"warning"},
];

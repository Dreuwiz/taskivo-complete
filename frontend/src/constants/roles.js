export const ROLES = {
  user: {
    id:"user", label:"User / Staff", color:"#38827A", lightBg:"#e6f4f2",
    icon:"fa-solid fa-user", tagline:"Manage personal tasks & track individual progress",
    capabilities:["View & manage own tasks only","Track personal streaks & achievements","Monitor personal dashboard stats"],
  },
  team_leader: {
    id:"team_leader", label:"Team Leader / Supervisor", color:"#694AD7", lightBg:"#ede9fc",
    icon:"fa-solid fa-users-gear", tagline:"Oversee team tasks & monitor team performance",
    capabilities:["All User / Staff capabilities","Assign tasks to team members","Approve & track team completions","View team overview & analytics"],
  },
  manager: {
    id:"manager", label:"Manager", color:"#c47b00", lightBg:"#fff4e0",
    icon:"fa-solid fa-briefcase", tagline:"Manage multiple teams & department analytics",
    capabilities:["All Team Leader capabilities","Department-wide task visibility","Manage & reassign team leaders","Full department analytics & reports"],
  },
  admin: {
    id:"admin", label:"Admin", color:"#c0392b", lightBg:"#fdecea",
    icon:"fa-solid fa-shield-halved", tagline:"Full system access & user management",
    capabilities:["All Manager capabilities","Add, edit & remove any user","Assign & change user roles","System-wide analytics & audit logs","System settings & configuration"],
  },
};

// Mutable session object — patched at login time by App.jsx
export const SESSION = {
  user:        { id:1, name:"Alice Santos", team:"Alpha", streak:4  },
  team_leader: { id:5, name:"Dan Lim",      team:"Alpha", streak:9  },
  manager:     { id:7, name:"Frank Ong",    team:null,    streak:3  },
  admin:       { id:8, name:"Grace Ko",     team:null,    streak:14 },
};

export const NAV_BY_ROLE = {
  user:[
    {id:"dashboard",    icon:"fa-solid fa-house",                    label:"Dashboard"   },
    {id:"tasks",        icon:"fa-solid fa-file",                     label:"Tasks"       },
    {id:"achievements", icon:"fa-solid fa-trophy",                   label:"Achievements"},
    {id:"logout",       icon:"fa-solid fa-arrow-right-from-bracket", label:"Logout"      },
  ],
  team_leader:[
    {id:"dashboard",     icon:"fa-solid fa-house",                    label:"Dashboard"    },
    {id:"tasks",         icon:"fa-solid fa-file",                     label:"Tasks"        },
    {id:"team_overview", icon:"fa-solid fa-people-group",             label:"Team Overview"},
    {id:"achievements",  icon:"fa-solid fa-trophy",                   label:"Achievements" },
    {id:"analytics",     icon:"fa-solid fa-chart-line",               label:"Analytics"    },
    {id:"logout",        icon:"fa-solid fa-arrow-right-from-bracket", label:"Logout"       },
  ],
  manager:[
    {id:"dashboard",       icon:"fa-solid fa-house",                    label:"Dashboard"      },
    {id:"tasks",           icon:"fa-solid fa-file",                     label:"Tasks"          },
    {id:"team_management", icon:"fa-solid fa-sitemap",                  label:"Team Management"},
    {id:"analytics",       icon:"fa-solid fa-chart-line",               label:"Analytics"      },
    {id:"logout",          icon:"fa-solid fa-arrow-right-from-bracket", label:"Logout"         },
  ],
  admin:[
    {id:"dashboard",       icon:"fa-solid fa-house",                    label:"Dashboard"      },
    {id:"tasks",           icon:"fa-solid fa-file",                     label:"Tasks"          },
    {id:"team_management", icon:"fa-solid fa-sitemap",                  label:"Team Management"},
    {id:"analytics",       icon:"fa-solid fa-chart-line",               label:"Analytics"      },
    {id:"user_management", icon:"fa-solid fa-users",                    label:"User Management"},
    {id:"system_settings", icon:"fa-solid fa-gear",                     label:"System Settings"},
    {id:"logout",          icon:"fa-solid fa-arrow-right-from-bracket", label:"Logout"         },
  ],
};
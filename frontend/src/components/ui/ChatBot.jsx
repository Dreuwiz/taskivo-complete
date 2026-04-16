import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faCheck, faMedal, faChartBar, faLightbulb, faUsers, faChartLine, faPlus, faUser, faCalendar, faRotate, faGear, faTrash, faQuestion, faClock, faFlag, faRobot } from "@fortawesome/free-solid-svg-icons";

// ─── Get icon for suggestion ───────────────────────────────────────────────────
const getSuggestionIcon = (suggestionText) => {
  for (const role of Object.values(QUICK_REPLIES)) {
    const found = role.find(q => q.label === suggestionText);
    if (found) return found.icon;
  }
  return faQuestion; // default
};
const QUICK_REPLIES = {
  team_member: [
    { icon: faClipboard, label: "How do I view my tasks?",       id: "view_tasks" },
    { icon: faCheck,     label: "How do I complete a task?",      id: "complete_task" },
    { icon: faMedal,     label: "What are achievements?",         id: "achievements" },
    { icon: faChartBar,  label: "How does leveling work?",        id: "leveling" },
    { icon: faLightbulb, label: "Productivity tips",              id: "tips" },
    { icon: faQuestion,  label: "FAQ",                            id: "faq_member" },
  ],
  team_leader: [
    { icon: faPlus,      label: "How do I create a task?",        id: "add_task" },
    { icon: faUser,      label: "How do I assign a task?",        id: "assign_task" },
    { icon: faChartLine,  label: "How do I track team progress?",  id: "track_progress" },
    { icon: faMedal,     label: "What are achievements?",         id: "achievements" },
    { icon: faChartBar,  label: "How does leveling work?",        id: "leveling" },
    { icon: faQuestion,  label: "FAQ",                            id: "faq_leader" },
  ],
  manager: [
    { icon: faUsers,     label: "How do I manage teams?",         id: "manage_teams" },
    { icon: faChartBar,  label: "How do I view reports?",         id: "view_reports" },
    { icon: faPlus,      label: "How do I create a project?",     id: "create_project" },
    { icon: faRotate,    label: "How do I reassign tasks?",       id: "reassign_task" },
    { icon: faCalendar,  label: "How do I set deadlines?",        id: "set_deadlines" },
    { icon: faQuestion,  label: "FAQ",                            id: "faq_manager" },
  ],
  admin: [
    { icon: faUser,      label: "How do I manage users?",         id: "manage_users" },
    { icon: faGear,      label: "How do I assign roles?",         id: "assign_roles" },
    { icon: faGear,      label: "How do I configure settings?",  id: "configure_settings" },
    { icon: faChartBar,  label: "How do I view all activity?",    id: "view_activity" },
    { icon: faTrash,     label: "How do I remove a user?",       id: "remove_user" },
    { icon: faQuestion,  label: "FAQ",                            id: "faq_admin" },
  ],
};

// ─── Predefined Responses ─────────────────────────────────────────────────────
const RESPONSES = {
  // ── Team Member ──────────────────────────────────────────────────────────────
  view_tasks: {
    text: "To view your tasks:\n1. Go to the Task Tab\n2. Your assigned tasks will appear in the task list\n3. You can filter by status — Pending, In Progress, or Completed",
    suggestions: ["How do I complete a task?", "What are achievements?"],
  },
  complete_task: {
    text: "To complete a task:\n1. Open the Task Tab\n2. Click the ✅ 'Mark as Complete' button\n3. The task status will update to Completed\n4. Your progress and XP will be updated automatically!",
    suggestions: ["How does leveling work?", "What are achievements?"],
  },
  faq_member: {
    text: "Team Member FAQ:\n\n❓ Can I create my own tasks?\nNo — tasks are assigned to you by your Team Leader.\n\n❓ Can I see other members' tasks?\nNo, you can only view tasks assigned to you.\n\n❓ What happens if I miss a deadline?\nYou won't earn the Perfect Week badge but no XP is deducted.\n\n❓ Who do I contact for task issues?\nReach out to your Team Leader.",
    suggestions: ["How do I view my tasks?", "Productivity tips"],
  },

  // ── Team Leader ───────────────────────────────────────────────────────────────
  add_task: {
    text: "To create a task:\n1. Go to the Task Tab\n2. Click ➕ 'Add Task'\n3. Fill in the title, description, and due date\n4. Assign it to a team member\n5. Click Save — it appears in the task list immediately!",
    suggestions: ["How do I assign a task?", "How do I track team progress?"],
  },
  assign_task: {
    text: "To assign a task:\n1. Open an existing task or create a new one\n2. Find the 'Assign To' field\n3. Select a team member from the dropdown\n4. Save the task — the member will see it in their Dashboard",
    suggestions: ["How do I track team progress?", "How do I reassign tasks?"],
  },
  track_progress: {
    text: "To track your team's progress:\n1. Go to the Dashboard\n2. You can see all tasks and their statuses — Pending, In Progress, Completed\n3. Filter by member to see individual progress\n4. Check the Reports section for an overview",
    suggestions: ["How do I reassign tasks?", "How do I set deadlines?"],
  },
  faq_leader: {
    text: "Team Leader FAQ:\n\n❓ Can I edit a task after creating it?\nYes — open the task and click Edit.\n\n❓ Can I reassign a task to another member?\nYes — open the task and change the assigned member.\n\n❓ Can I see my team's achievements?\nYes — visit the Achievements page to see the team's earned badges.\n\n❓ Do I earn XP too?\nYes! You earn XP and badges just like members.",
    suggestions: ["How do I create a task?", "How do I track team progress?"],
  },

  // ── Manager ───────────────────────────────────────────────────────────────────
  manage_teams: {
    text: "To manage your teams:\n1. Go to the Team Manmagement Tab\n2. View all teams and their members\n3. You can add or remove members from a team\n4. Assign a Team Leader to each team",
    suggestions: ["How do I view reports?", "How do I reassign tasks?"],
  },
  view_reports: {
    text: "To view reports:\n1. Go to the Analytics Tab\n2. See overall task completion rates per team\n3. Filter by date range, team, or member\n4. Export reports if needed",
    suggestions: ["How do I manage teams?", "How do I set deadlines?"],
  },
  create_project: {
    text: "To create a project:\n1. Go to Task Tab\n2. Click ➕ 'New Project'\n3. Set the project name, description, and deadline\n4. Assign a Team Leader and members to it\n5. Tasks created under this project will be grouped together",
    suggestions: ["How do I manage teams?", "How do I set deadlines?"],
  },
  reassign_task: {
    text: "To reassign a task:\n1. Open the Task Tab\n2. Click 'Edit'\n3. Change the 'Assign To' field to a different member\n4. Save — the task moves to the new member's Dashboard",
    suggestions: ["How do I track team progress?", "How do I set deadlines?"],
  },
  set_deadlines: {
    text: "To set or update deadlines:\n1. Open any task \n2. Click the 'Due Date' field\n3. Pick a date from the calendar\n4. Save — members will see the updated deadline on their Dashboard",
    suggestions: ["How do I reassign tasks?", "How do I view reports?"],
  },
  faq_manager: {
    text: "Manager FAQ:\n\n❓ Can I create tasks directly?\nYes — managers can create and assign tasks to any team.\n\n❓ Can I see all teams' data?\nYes — you have visibility across all teams you manage.\n\n❓ Can I override a Team Leader's decisions?\nYes — managers have higher permissions than Team Leaders.\n\n❓ Can I export reports?\nYes — use the Export button in the Reports section.",
    suggestions: ["How do I manage teams?", "How do I view reports?"],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────────
  manage_users: {
    text: "To manage users:\n1. Go to User Management Tab\n2. View all registered users and their roles\n3. You can edit user details, reset passwords, or deactivate accounts\n4. Use the search bar to find a specific user quickly",
    suggestions: ["How do I assign roles?", "How do I remove a user?"],
  },
  assign_roles: {
    text: "To assign or change a user's role:\n1. Go to User Mangement Tab\n2. Click on the user you want to update\n3. Open the 'Role' dropdown\n4. Select: Team Member, Team Leader, Manager, or Admin\n5. Save — the user's permissions update immediately",
    suggestions: ["How do I manage users?", "How do I configure settings?"],
  },
  configure_settings: {
    text: "To configure system settings:\n1. Go to System Settings Tab\n2. Update system-wide preferences such as:\n   • App name and branding\n   • Notification settings\n   • Default task deadlines\n   • XP and leveling thresholds\n3. Click Save to apply changes",
    suggestions: ["How do I view all activity?", "How do I assign roles?"],
  },
  view_activity: {
    text: "To view all system activity:\n1. Go to System Settings\n2. See a full log of actions across all users:\n   • Tasks created, updated, completed\n   • Role changes\n   • Login activity\n3. Filter by user, date, or action type",
    suggestions: ["How do I manage users?", "How do I configure settings?"],
  },
  remove_user: {
    text: "To remove a user:\n1. Go to User Management Tab\n2. Find the user using the search bar\n3. Click on their profile\n4. Click 'Deactivate' or 'Delete'\n   • Deactivate — keeps their data but blocks access\n   • Delete — permanently removes the user and their data\n5. Confirm the action",
    suggestions: ["How do I manage users?", "How do I assign roles?"],
  },
  faq_admin: {
    text: "Admin FAQ:\n\n❓ Can I reset a user's password?\nYes — go to Users, select the user, and click 'Reset Password'.\n\n❓ Can I change XP thresholds for leveling?\nYes — update them in Settings → Leveling Config.\n\n❓ Can I see all chat/activity logs?\nYes — the Activity Log shows all system-wide actions.\n\n❓ Can I create another Admin?\nYes — assign the Admin role to any user from the Users panel.",
    suggestions: ["How do I manage users?", "How do I configure settings?"],
  },

  // ── Shared across all roles ───────────────────────────────────────────────────
  achievements: {
    text: "Achievements are badges earned by hitting milestones:\n\n🔥 7-Day Streak — complete tasks 7 days in a row\n⭐ Task Master — complete 50 tasks total\n⚡ Speed Runner — finish 5 tasks in one day\n🏆 Top Performer — rank #1 in your team for the week\n🎖 Perfect Week — zero missed deadlines\n👑 Legendary — 30-day task streak\n\nVisit the Achievements page to track your progress!",
    suggestions: ["How does leveling work?", "Productivity tips"],
  },
  leveling: {
    text: "The leveling system rewards you with XP for earning badges:\n\n⭐ Task Master → 500 XP\n🔥 7-Day Streak → 200 XP\n🎖 Perfect Week → 300 XP\n⚡ Speed Runner → 350 XP\n🏆 Top Performer → 400 XP\n👑 Legendary → 750 XP\n\nEvery 500 XP (scaling per level) earns you a new rank — from Newcomer all the way to Mythic!",
    suggestions: ["What are achievements?", "Productivity tips"],
  },
  tips: {
    text: "Productivity tips to level up faster:\n\n🎯 Focus on one task at a time\n⏰ Set realistic due dates\n✅ Complete small tasks first for momentum\n🔁 Build a daily habit — streaks give big XP!\n📅 Review your tasks every morning\n🏁 Aim for a Perfect Week — zero missed deadlines!",
    suggestions: ["What are achievements?", "How does leveling work?"],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────────
  default: {
    text: "I'm not sure about that! 🤔 I can only help with questions about the Taskivo system. Try one of the options below.",
    suggestions: [],
  },
};

// ─── Keyword → Response Mapping (shared) ─────────────────────────────────────
const KEYWORDS = [
  { words: ["view", "see", "find", "my task"],              id: "view_tasks" },
  { words: ["complete", "finish", "done", "mark"],          id: "complete_task" },
  { words: ["add", "create", "new", "task"],                id: "add_task" },
  { words: ["assign", "give", "delegate"],                  id: "assign_task" },
  { words: ["progress", "track", "monitor", "status"],      id: "track_progress" },
  { words: ["team", "manage", "group"],                     id: "manage_teams" },
  { words: ["report", "summary", "overview", "export"],     id: "view_reports" },
  { words: ["project"],                                     id: "create_project" },
  { words: ["reassign", "move", "transfer", "change"],      id: "reassign_task" },
  { words: ["deadline", "due", "date", "schedule"],         id: "set_deadlines" },
  { words: ["user", "account", "member", "people"],         id: "manage_users" },
  { words: ["role", "permission", "access"],                id: "assign_roles" },
  { words: ["setting", "config", "system", "setup"],        id: "configure_settings" },
  { words: ["activity", "log", "history", "audit"],         id: "view_activity" },
  { words: ["remove", "delete", "deactivate", "ban"],       id: "remove_user" },
  { words: ["badge", "achievement", "earn", "streak"],      id: "achievements" },
  { words: ["level", "xp", "exp", "rank", "points"],        id: "leveling" },
  { words: ["tip", "advice", "productive", "habit"],        id: "tips" },
];

// ─── Greeting per role ────────────────────────────────────────────────────────
const GREETING = {
  team_member: "Hi! I'm your Taskivo Assistant 👋\nI can help you with your tasks, achievements, and leveling. What do you need?",
  team_leader: "Hi, Leader! 👋 I'm your Taskivo Assistant.\nI can help you manage tasks, track your team, and more. What do you need?",
  manager:     "Hi, Manager! 👋 I'm your Taskivo Assistant.\nI can help you with teams, reports, projects, and more. What do you need?",
  admin:       "Hi, Admin! 👋 I'm your Taskivo Assistant.\nI can help you manage users, roles, settings, and system activity. What do you need?",
};

function getPredefinedResponse(input) {
  const lower = input.toLowerCase();
  for (const { words, id } of KEYWORDS) {
    if (words.some(w => lower.includes(w))) return RESPONSES[id] || RESPONSES.default;
  }
  return RESPONSES.default;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChatBot({ role = "team_member" }) {
  const quickReplies = QUICK_REPLIES[role] || QUICK_REPLIES.team_member;
  const greeting     = GREETING[role]      || GREETING.team_member;

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: greeting,
      suggestions: quickReplies.map(q => q.label),
    }
  ]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, typing]);

  function addBotMessage({ text, suggestions = [] }) {
    setMessages(prev => [...prev, { role: "assistant", text, suggestions }]);
  }

  function handleSend(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || typing) return;

    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    const response = getPredefinedResponse(trimmed);
    setTimeout(() => {
      setTyping(false);
      addBotMessage({
        text: response.text,
        // If default fallback, show all quick replies again
        suggestions: response.suggestions.length > 0
          ? response.suggestions
          : quickReplies.map(q => q.label),
      });
    }, 500);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([{
      role: "assistant",
      text: greeting,
      suggestions: quickReplies.map(q => q.label),
    }]);
  }

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 9999,
          width: 360, height: 520,
          background: "#fff", borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", border: "1px solid #ececec",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #f0ad00, #e74c3c)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>
                <FontAwesomeIcon icon={faRobot} style={{ color: "white" }} />
              </div>
              <div>
                <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14 }}>Taskivo Assistant</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                  {typing ? "Typing..." : "Always here to help"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={clearChat} title="Clear chat" style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                borderRadius: 8, color: "#fff", cursor: "pointer", padding: "4px 8px", fontSize: 12,
              }}>
                <i className="fa-solid fa-rotate-left" />
              </button>
              <button onClick={() => setOpen(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                borderRadius: 8, color: "#fff", cursor: "pointer", padding: "4px 8px", fontSize: 14,
              }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px 8px",
            display: "flex", flexDirection: "column", gap: 10,
            background: "#f9f9fb",
          }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "82%", padding: "10px 13px",
                    borderRadius: m.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: m.role === "user"
                      ? "linear-gradient(135deg, #694AD7, #0f3460)"
                      : "#fff",
                    color: m.role === "user" ? "#fff" : "#1a1a1a",
                    fontSize: 13, lineHeight: 1.6,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {m.text}
                  </div>
                </div>

                {/* Suggestion chips */}
                {m.suggestions?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {m.suggestions.map((s, j) => (
                      <button key={j} onClick={() => handleSend(s)} style={{
                        background: "#fff", border: "1.5px solid #e0d6ff",
                        borderRadius: 20, padding: "5px 11px",
                        fontSize: 12, color: "#694AD7", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "#694AD7";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.color = "#694AD7";
                        }}
                      >
                        <FontAwesomeIcon icon={getSuggestionIcon(s)} style={{ marginRight: 4 }} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px", background: "#fff",
                  borderRadius: "16px 16px 16px 4px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 0.2, 0.4].map((delay, idx) => (
                    <div key={idx} style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#ccc",
                      animation: `bounce 1s infinite ${delay}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #ececec",
            background: "#fff", display: "flex", gap: 8, alignItems: "flex-end",
            flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Taskivo..."
              rows={1}
              style={{
                flex: 1, resize: "none", border: "1.5px solid #e8e8e8",
                borderRadius: 10, padding: "9px 12px",
                fontSize: 13, outline: "none", fontFamily: "inherit",
                background: "#f9f9fb", color: "#1a1a1a",
                maxHeight: 100, lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: input.trim() && !typing
                  ? "linear-gradient(135deg, #694AD7, #0f3460)"
                  : "#e8e8e8",
                border: "none",
                cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: input.trim() && !typing ? "#fff" : "#aaa", fontSize: 14,
              }}
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #694AD7, #0f3460)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(105,74,215,0.45)",
          fontSize: 22, color: "#fff", transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-comment-dots"}`} />
      </button>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
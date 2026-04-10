import { useState, useEffect } from "react";
import { SESSION } from "./constants/roles";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginScreen } from "./pages/LoginScreen";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { TeamOverviewPage } from "./pages/TeamOverviewPage";
import { TeamManagementPage } from "./pages/TeamManagementPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { SystemSettingsPage } from "./pages/SystemSettingsPage";
import { ChatBot } from "./components/ui/ChatBot";
import * as api from "./services/api";

const ROLE_MAP = {
  "user":        "user",
  "leader":      "team_leader",
  "team_leader": "team_leader",
  "manager":     "manager",
  "admin":       "admin",
};

const DEFAULT_SETTINGS = {
  maxTasksPerDay:                 10,
  defaultPriority:                "Medium",
  requireApprovalForHighPriority: false,
};

// ── Normalize assignedTo ──────────────────────────────────────────────────────
const normalizeTask = (t) => {
  const raw = t.assignedTo ?? t.assigned_to ?? null;
  let assignedTo = [];

  if (Array.isArray(raw)) {
    assignedTo = raw.filter(Boolean);
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        assignedTo = Array.isArray(parsed)
          ? parsed.filter(Boolean)
          : trimmed ? [trimmed] : [];
      } catch {
        assignedTo = trimmed ? [trimmed] : [];
      }
    } else if (trimmed.includes(",")) {
      assignedTo = trimmed.split(",").map(s => s.trim()).filter(Boolean);
    } else if (trimmed) {
      assignedTo = [trimmed];
    }
  }

  return {
    ...t,
    assignedTo,
    assigned_to: assignedTo[0] || "",
  };
};

// ── Prepare task payload for the API ─────────────────────────────────────────
const serializeTask = (task) => {
  const names = Array.isArray(task.assignedTo) ? task.assignedTo : [];
  return {
    ...task,
    assignedTo:  names,
    assigned_to: names.length === 1
      ? names[0]
      : JSON.stringify(names),
  };
};

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_PENDING = "taskivo_pending";

const getPending = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_PENDING)) || {};
    const out = {};
    for (const [id, task] of Object.entries(raw)) {
      out[id] = normalizeTask(task);
    }
    return out;
  } catch { return {}; }
};

const savePending   = (map)  => { try { localStorage.setItem(LS_PENDING, JSON.stringify(map)); } catch {} };
const addPending    = (task) => { const m = getPending(); m[task.id] = task; savePending(m); };
const removePending = (id)   => { const m = getPending(); delete m[id]; savePending(m); };

const mergeWithPending = (apiTasks) => {
  const pending = getPending();
  return apiTasks
    .map(t => pending[t.id] ? normalizeTask({ ...t, ...pending[t.id] }) : normalizeTask(t));
};

// ── getEffectiveTeam — mirrors TasksPage.jsx logic ───────────────────────────
// Must stay in sync with the same function in TasksPage.jsx.
// Used here for the sidebar badge count.
const getEffectiveTeam = (t, users) => {
  if (t.team) return t.team;
  if (!users || !users.length) return null;
  const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [];
  for (const name of assignees) {
    const u = users.find(u => u.name?.toLowerCase().trim() === name?.toLowerCase().trim());
    // Skip team leaders — tasks assigned directly to them shouldn't re-route through TL review
    if (u?.team && !["team_leader", "leader"].includes(u.role)) return u.team;
  }
  return null;
};

// ── Review routing helpers — mirrors TasksPage.jsx ───────────────────────────
const needsTLReview  = (t, users) =>
  t.status === "Under Review" && !!getEffectiveTeam(t, users) && t.teamLeaderReviewed !== true;
const needsMgrReview = (t, users) =>
  t.status === "Under Review" && (!getEffectiveTeam(t, users) || t.teamLeaderReviewed === true);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [activePage,  setActivePage]  = useState("dashboard");
  const [taskFilter,  setTaskFilter]  = useState("All");
  const [tasks,       setTasks]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [auditLog,    setAuditLog]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to show/hide sidebar appropriately
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarVisible(true); // Always show sidebar on desktop
      } else {
        setSidebarVisible(false); // Hide sidebar on mobile by default
      }
    };

    // Set initial state
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const role       = currentUser?.role || null;
  const mappedRole = ROLE_MAP[role] || "user";

  const fetchTasks = async () => {
    try {
      const t = await api.getTasks();
      if (t) {
        const merged = mergeWithPending(t);
        console.log("[Taskivo] fetched tasks:", merged.length, "items");
        setTasks(merged);
      }
    } catch (err) {
      console.error("refresh tasks failed:", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [t, u, a] = await Promise.all([
        api.getTasks(),
        api.getUsers(),
        api.getAudit(),
      ]);
      if (t) {
        const merged = mergeWithPending(t);
        console.log("[Taskivo] tasks loaded, first 3:", merged.slice(0, 3).map(x => ({
          id: x.id, title: x.title, assignedTo: x.assignedTo, assigned_to: x.assigned_to,
        })));
        setTasks(merged);
      }
      setUsers(u || []);
      setAuditLog(a || []);
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  useEffect(() => { setLoading(false); }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchInitialData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const intervalId = setInterval(fetchTasks, 15000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (activePage === "tasks") {
      console.log("[Taskivo] refreshing tasks because Tasks page is active");
      fetchTasks();
    }
  }, [activePage, currentUser]);

  const handleLogin = (token, user) => {
    if (!token || !user) { console.error("❌ handleLogin received invalid data"); return; }
    const mappedR = ROLE_MAP[user.role] || "user";
    const session = { id: user.id, name: user.name, team: user.team, streak: user.streak };
    SESSION[mappedR] = session;
    setSessionData(session);
    api.setToken(token);
    setCurrentUser(user);
    setActivePage("dashboard");
    setTaskFilter("All");
    console.log("[Taskivo] logged in as:", session);
  };

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
    setSessionData(null);
    setTasks([]);
    setUsers([]);
    setAuditLog([]);
    setActivePage("dashboard");
    setTaskFilter("All");
  };

  const onAddTask = async (task) => {
    const normalized = normalizeTask(task);
    const tempId     = `temp_${Date.now()}`;
    const tempTask   = { ...normalized, id: tempId };

    console.log("[Taskivo] adding task optimistically:", tempTask.title, "→ assignedTo:", tempTask.assignedTo);

    setTasks(p => [tempTask, ...p]);
    addPending(tempTask);

    try {
      const created   = await api.createTask(serializeTask(normalized));
      const finalTask = normalizeTask(created);
      console.log("[Taskivo] server confirmed task:", finalTask.title, "→ assignedTo:", finalTask.assignedTo);
      removePending(tempId);
      setTasks(p => p.map(x => x.id === tempId ? finalTask : x));
    } catch (err) {
      console.error("createTask failed:", err);
    }
  };

  const onUpdateTask = async (task) => {
    const updated = normalizeTask({
      ...task,
      ...(task.status === "Completed" && !task.completedAt
        ? { completedAt: new Date().toISOString() }
        : {}),
    });

    // Optimistically update UI immediately
    setTasks(p => p.map(x => x.id === updated.id ? updated : x));
    addPending(updated);

    try {
      const serverResponse = await api.updateTask(serializeTask(updated));

      // CRITICAL FIX: When merging the server response back, we must preserve
      // frontend-only routing fields that the backend may not return/store yet.
      // If the server doesn't know about teamLeaderReviewed, it will come back
      // as null/undefined and overwrite our local false — breaking TL routing.
      const final = normalizeTask({
        ...updated,         // our local state is the source of truth for routing fields
        ...serverResponse,  // server wins on fields it does manage (title, status, etc.)
        // Explicitly re-apply routing fields from our local copy if server didn't return them
        teamLeaderReviewed:   serverResponse.teamLeaderReviewed   ?? updated.teamLeaderReviewed,
        teamLeaderApprovedBy: serverResponse.teamLeaderApprovedBy ?? updated.teamLeaderApprovedBy,
        teamLeaderApprovedAt: serverResponse.teamLeaderApprovedAt ?? updated.teamLeaderApprovedAt,
        userCompletions:      serverResponse.userCompletions      ?? updated.userCompletions,
        rejectionReason:      serverResponse.rejectionReason      ?? updated.rejectionReason,
        rejectedBy:           serverResponse.rejectedBy           ?? updated.rejectedBy,
      });

      setTasks(p => p.map(x => x.id === final.id ? final : x));
      removePending(final.id);
    } catch (err) {
      console.error("updateTask failed:", err);
      // Keep the optimistic update in pending so it survives a refresh
    }
  };

  const onDeleteTask = async (id) => {
    setTasks(p => p.filter(x => x.id !== id));
    removePending(id);
    try { await api.deleteTask(id); }
    catch (err) { console.error("deleteTask failed:", err); }
  };

  // ── User handlers ────────────────────────────────────────────────────────────
  const onAddUser = (user) => {
    setUsers(p => [...p, user]);
  };

  const onUpdateUser = (user) => {
    setUsers(p => p.map(x => x.id === user.id ? user : x));
  };

  const onDeleteUser = async (id) => {
    setUsers(p => p.filter(x => x.id !== id));
    try {
      await api.deleteUser(id);
    } catch (err) {
      console.error("deleteUser failed:", err);
      await fetchInitialData();
    }
  };

  const onAuditAdd = async (action, type = "info") => {
    try {
      const entry = await api.addAudit({ action, type });
      setAuditLog(p => [entry, ...p]);
    } catch (err) { console.error("Audit log error:", err); }
  };

  // FIX: Use getEffectiveTeam + proper routing helpers instead of t.team directly
  const pendingReviewCount = (() => {
    if (!["team_leader", "manager", "admin"].includes(mappedRole)) return 0;
    const session = SESSION[mappedRole];
    if (mappedRole === "team_leader") {
      return tasks.filter(t =>
        needsTLReview(t, users) && getEffectiveTeam(t, users) === session?.team
      ).length;
    }
    // manager/admin: tasks where TL already approved OR no team (direct to manager)
    return tasks.filter(t => needsMgrReview(t, users)).length;
  })();

  const handleNav = (id) => {
    if (id === "logout") { handleLogout(); return; }
    if (id === "tasks") setTaskFilter("All");
    setActivePage(id);
    // Hide sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  if (loading)      return <h1>Loading...</h1>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile Header - only visible on small screens */}
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          justifyContent: "space-between"
        }}>
          <button
            onClick={toggleSidebar}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px"
            }}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
            Taskivo
          </div>
          <div style={{ width: "40px" }}></div> {/* Spacer */}
        </div>
      )}

      {isMobile && sidebarVisible && (
        <div className="sidebar-backdrop" onClick={() => setSidebarVisible(false)} />
      )}

      {/* Sidebar with responsive visibility */}
      <div className={sidebarVisible || !isMobile ? "" : "sidebar-mobile-hidden"}>
        <Sidebar
          currentUser={currentUser}
          activePage={activePage}
          onNav={handleNav}
          pendingReviewCount={pendingReviewCount}
          mappedRole={mappedRole}
          isMobile={isMobile}
          onCloseSidebar={() => setSidebarVisible(false)}
        />
      </div>

      {/* Main content with responsive margin */}
      <main className={isMobile ? "main-content-mobile" : ""} style={{
        marginLeft: isMobile ? "0" : "250px",
        padding: isMobile ? "76px 16px 20px" : "20px",
        width: "100%",
        flex: 1,
        transition: "margin-left 0.3s ease"
      }}>
        {activePage === "dashboard" && (
          <DashboardPage role={mappedRole} tasks={tasks ?? []} users={users ?? []} sessionData={sessionData} />
        )}
        {activePage === "tasks" && (
          <TasksPage
            role={mappedRole}
            tasks={tasks ?? []}
            users={users ?? []}
            settings={settings}
            initialFilter={taskFilter}
            sessionData={sessionData}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        )}
        {activePage === "achievements" && (
          <AchievementsPage role={mappedRole} tasks={tasks ?? []} />
        )}
        {activePage === "analytics" && (
          <AnalyticsPage role={mappedRole} tasks={tasks ?? []} users={users ?? []} />
        )}
        {activePage === "team_overview" && (
          <TeamOverviewPage role={mappedRole} tasks={tasks ?? []} users={users ?? []} onUpdateTask={onUpdateTask} />
        )}
        {activePage === "team_management" && (
          <TeamManagementPage role={mappedRole} tasks={tasks ?? []} users={users ?? []} onUpdateUser={onUpdateUser} />
        )}
        {activePage === "user_management" && (
          <UserManagementPage
            users={users ?? []}
            tasks={tasks ?? []}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
          />
        )}
        {activePage === "system_settings" && (
          <SystemSettingsPage
            auditLog={auditLog ?? []}
            onAuditAdd={onAuditAdd}
            users={users ?? []}
            tasks={tasks ?? []}
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
      </main>

      {currentUser && <ChatBot role={mappedRole} />}
    </div>
  );
}
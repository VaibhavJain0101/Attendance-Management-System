import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './app/router/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import HomeRedirectPage from './pages/HomeRedirectPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import AccountPage from './pages/AccountPage';
import AdminUsersPage from './pages/AdminUsersPage';
import { ROLES } from './utils/constants';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN]} />}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirectPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/account" element={<AccountPage />} />

        <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
          <Route path="/employee" element={<EmployeeDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]} />}>
          <Route path="/manager" element={<ManagerDashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;

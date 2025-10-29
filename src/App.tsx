import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./features/dashboard/Dashboard";
import UserManagement from "./features/users/UserManagement";
import ContentPush from "./features/content/ContentPush";
import EventManagement from "./features/events/EventManagement";
import PagePlaceholder from "./pages/PagePlaceholder";
import UploadDocuments from "./features/documents/UploadDocuments";
import MediaManagement from "./features/media/MediaManagement";

export default function App() {
  console.log('App component rendering');
  
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="content" element={<ContentPush />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="media" element={<MediaManagement />} />
        <Route path="analytics" element={<PagePlaceholder title="Analytics" />} />
        <Route path="uploads" element={<UploadDocuments />} />
      </Route>
    </Routes>
  );
}

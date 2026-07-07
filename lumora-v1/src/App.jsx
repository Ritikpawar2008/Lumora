import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import MyStartups from "./pages/MyStartups";
import IdeaVault from "./pages/Idea";
import AIFounder from "./pages/Aifounder";
import {VisionAI} from "./pages/VisionAI";
import Analytics from './pages/Anal'
import LandingPage  from "./pages/LandingPage";
import BrandStudio from "./pages/BrandStudio";
import BusinessCanvas from "./pages/Business";
import Profile from "./pages/Profile";
import LumoraSettings from "./pages/Setting";
import EmailCenter from "./pages/EmailCentre";


export function App() {
  return (
    <BrowserRouter>
     
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/authpage" element={<AuthPage />} />
          <Route path="/dashboard"element={<Dashboard />}/>
          <Route path="*" element={<Navigate to="/authpage" replace />} />
           <Route path="/mystartups" element={<MyStartups/>} />
           <Route path="/ideas" element={<IdeaVault/>} />
           <Route path="/founder" element={<AIFounder/>}  />
          <Route path="/visionai" element={<VisionAI/>}  />
          <Route path="/analytics" element={<Analytics/>}  />
          <Route path="/brand" element={<BrandStudio/>}  />
          <Route path="/canvas" element={<BusinessCanvas/>}  />
          <Route path="/profile" element={<Profile/>}  />
          <Route path="/setting" element={<LumoraSettings/>}  />
          <Route path="/email" element={<EmailCenter/>}  />
          
          
        </Routes>
    </BrowserRouter>
  );
}

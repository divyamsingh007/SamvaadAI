import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import AboutUs from "./pages/AboutUs";
import PreInterview from "./pages/PreInterview";
import PreVapiInterview from "./pages/PreVapiInterview";
import Interview from "./pages/Interview";
import VapiInterview from "./pages/VapiInterview";
import Results from "./pages/Results";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pre-interview" element={<PreInterview />} />
      <Route path="/pre-vapi-interview" element={<PreVapiInterview />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/vapi-interview" element={<VapiInterview />} />
      <Route path="/vapi-interview/:id" element={<VapiInterview />} />
      <Route path="/results" element={<Results />} />
      <Route path="/results/:id" element={<Results />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/about-us" element={<AboutUs />} />
    </Routes>
  );
}

export default App;

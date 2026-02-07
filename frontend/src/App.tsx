import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import AboutUs from "./pages/AboutUs";
import PreInterview from "./pages/PreInterview";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pre-interview" element={<PreInterview />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/about-us" element={<AboutUs />} />
    </Routes>
  );
}

export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Marketplace from "./pages/Marketplace";
import MySwaps from "./pages/MySwaps";
import MyClothing from "./pages/MyClothing";
import AddClothing from "./pages/AddClothing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ClothingDetails from "./pages/ClothingDetails";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import SwapValueCalculator from "./pages/SwapValueCalculator";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import PublicMemberProfile from "./pages/PublicMemberProfile";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Marketplace />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/swaps" element={<MySwaps />} />

        <Route path="/my-clothing" element={<MyClothing />} />

        <Route path="/add-clothing" element={<AddClothing />} />

        <Route
          path="/swap-calculator"
          element={<SwapValueCalculator />}
        />

        <Route
          path="/clothing/:id"
          element={<ClothingDetails />}
        />

        <Route
          path="/chat/:swapRequestId"
          element={<Chat />}
        />

        <Route path="/profile" element={<Profile />} />

        <Route path="/edit-profile" element={<EditProfile />} />

        {/* Public Member Profile */}
        <Route
          path="/members/:userId"
          element={<PublicMemberProfile />}
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, Layout } from './shared.jsx';
import Home from './pages/HomePage.jsx';
import Browse from './pages/BrowsePage.jsx';
import ItemDetail from './pages/ItemDetailsPage.jsx';
import Auth from './pages/AuthPage.jsx';
import Dashboard from './pages/DashboardPage.jsx';
import Sell from './pages/SellPage.jsx';
import MyListings from './pages/MyListingsPage.jsx';
import Swaps from './pages/SwapsPage.jsx';
import Wishlist from './pages/WishlistPage.jsx';
import Notifications from './pages/NotificationsPage.jsx';
import Profile from './pages/ProfilePage.jsx';
import Admin from './pages/AdminPage.jsx';
import How from './pages/HowItWorksPage.jsx';
import NotFound from './pages/NotFoundPage.jsx';

export default function App() {
  return <AuthProvider><Layout><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/browse" element={<Browse />} />
    <Route path="/items/:id" element={<ItemDetail />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/sell" element={<Sell />} />
    <Route path="/my-listings" element={<MyListings />} />
    <Route path="/swaps" element={<Swaps />} />
    <Route path="/wishlist" element={<Wishlist />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/how-it-works" element={<How />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Layout></AuthProvider>;
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bell, Check, ChevronLeft, Heart, Leaf, LogOut, Menu, Plus, Repeat2, Search, Shirt, Shield, Sparkles, UserRound, X } from 'lucide-react';
import { api, useAuth, Protected, ItemCard, PageTitle, Empty, Step, DashCard, categories, conditions, images } from '../shared.jsx';
export default function Wishlist(){const [items,setItems]=useState([]);const load=()=>api('/wishlist').then(x=>setItems(x.items));useEffect(load,[]);return <Protected><PageTitle title="Wishlist" text="Pieces you're keeping an eye on."/><div className="grid4">{items.map(i=><ItemCard key={i.id} item={i}/>)}</div>{!items.length&&<Empty title="Nothing saved yet" text="Tap the heart on any listing to save it here."/>}</Protected>}

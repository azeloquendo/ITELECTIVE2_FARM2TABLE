"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { auth, db } from "../../../utils/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if user is admin
                const adminDoc = await getDoc(doc(db, "admins", user.uid));
                if (adminDoc.exists()) {
                    setUser(user);
                } else {
                    // Not an admin, redirect to signin
                    await signOut(auth);
                    router.push('/roleSelection/admin/signin');
                }
            } else {
                // No user, redirect to signin
                router.push('/roleSelection/admin/signin');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/roleSelection/admin/signin');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-273F4F">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-273F4F">Welcome, {user?.displayName || 'Admin'}</span>
                            <button
                                onClick={handleSignOut}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-273F4F mb-4">
                                Welcome to Admin Panel
                            </h2>
                            <p className="text-lg text-273F4F mb-8">
                                Manage your platform operations from here.
                            </p>
                            
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <h3 className="text-lg font-semibold text-273F4F mb-2">Total Users</h3>
                                    <p className="text-3xl font-bold text-purple-600">1,234</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <h3 className="text-lg font-semibold text-273F4F mb-2">Active Sellers</h3>
                                    <p className="text-3xl font-bold text-green-600">567</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border">
                                    <h3 className="text-lg font-semibold text-273F4F mb-2">Pending Orders</h3>
                                    <p className="text-3xl font-bold text-blue-600">89</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap justify-center gap-4">
                                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                                    Manage Users
                                </button>
                                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                                    View Reports
                                </button>
                                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                    System Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .text-273F4F {
                    color: #273F4F;
                }
            `}</style>
        </div>
    );
}
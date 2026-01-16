import React, { useState, useEffect } from "react";
import AdminSidebar from "../../pages/admin/AdminSidebar";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    actions?: React.ReactNode;
}

export default function AdminLayout({ children, title, actions }: AdminLayoutProps) {
    const [sidebarWidth, setSidebarWidth] = useState(256);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            <AdminSidebar onSidebarWidthChange={setSidebarWidth} />

            <main
                className="transition-all duration-300 min-h-screen"
                style={{
                    marginLeft: isDesktop ? sidebarWidth : 0,
                    width: isDesktop ? `calc(100% - ${sidebarWidth}px)` : "100%",
                }}
            >
                <div className="p-4 md:p-8 max-w-7xl mx-auto pt-20 lg:pt-8 w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                        </div>
                        {actions && <div className="flex items-center gap-3">{actions}</div>}
                    </div>

                    {/* Content */}
                    <div className="animate-in fade-in duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

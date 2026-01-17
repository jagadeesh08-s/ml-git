import React from 'react';
// import { Header } from './Header'; // Assuming Header is used in App.tsx or similar, or specific pages.
// We can include Header here or let pages include it. Let's make this a wrapper for page content.

interface AppLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className = "" }) => {
    return (
        <div className={`min-h-screen flex flex-col bg-background ${className}`}>
            {/* Background gradients or effects could go here */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

            <main className="flex-1 w-full max-w-[1920px] mx-auto overflow-hidden">
                {/* Added overflow-hidden to prevent horizontal scrollbars from negative margins or wide elements */}
                {children}
            </main>
        </div>
    );
};

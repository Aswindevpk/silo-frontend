import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out.');
  };

  // Mock dashboard data for a "Silo" file-storage application
  const storageUsed = 4.2; // GB
  const storageTotal = 15; // GB
  const storagePercentage = Math.round((storageUsed / storageTotal) * 100);

  const stats = [
    { name: 'Total Files', value: '142', change: '+12 this week', icon: 'file' },
    { name: 'Active Shares', value: '8', change: '2 expiring soon', icon: 'share' },
    { name: 'Bandwidth (MB)', value: '380.5', change: '80% within limit', icon: 'zap' },
  ];

  const recentFiles = [
    { name: 'project-proposal.pdf', size: '2.4 MB', type: 'PDF', updated: '2 hours ago' },
    { name: 'silo-architecture-v2.png', size: '12.8 MB', type: 'Image', updated: 'Yesterday' },
    { name: 'financial-sheet-q3.xlsx', size: '1.1 MB', type: 'Spreadsheet', updated: '3 days ago' },
    { name: 'docker-compose.yml', size: '4.8 KB', type: 'Config', updated: '5 days ago' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">Silo</span>
            </div>

            {/* User Dropdown / Controls */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold">{user?.username}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</span>
              </div>
              <Button variant="outline" className="h-9 border-zinc-300 dark:border-zinc-700 bg-transparent text-sm font-medium" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 sm:truncate sm:text-3xl sm:tracking-tight">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome back, <span className="font-semibold text-zinc-700 dark:text-zinc-300">{user?.username}</span>. Manage your digital silos.
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          
          {/* Storage Utilization Card (Spans 2 columns on wide layouts) */}
          <Card className="md:col-span-2 shadow-sm border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Storage Utilization</CardTitle>
              <CardDescription>Overall storage usage across all your files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight">{storageUsed} GB</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">used of {storageTotal} GB total</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div 
                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out" 
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{storagePercentage}% full</span>
                  <span>{storageTotal - storageUsed} GB available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Mapping */}
          {stats.map((stat, idx) => (
            <Card key={idx} className="shadow-sm border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.name}
                </CardTitle>
                <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  {stat.icon === 'file' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  )}
                  {stat.icon === 'share' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                  )}
                  {stat.icon === 'zap' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                    </svg>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}

          {/* Recent Files Table (Spans all columns on wide layouts) */}
          <Card className="md:col-span-3 lg:col-span-4 shadow-sm border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold">Recent Uploads</CardTitle>
                <CardDescription>Manage your recently uploaded items in this silo</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="bg-transparent text-xs font-semibold h-8">
                Upload File
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-xs font-medium uppercase">
                      <th className="py-3 px-2">File Name</th>
                      <th className="py-3 px-2">Size</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Updated</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.map((file, idx) => (
                      <tr key={idx} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-2 font-medium flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          {file.name}
                        </td>
                        <td className="py-3 px-2 text-zinc-500 dark:text-zinc-400">{file.size}</td>
                        <td className="py-3 px-2 text-zinc-500 dark:text-zinc-400">{file.type}</td>
                        <td className="py-3 px-2 text-zinc-500 dark:text-zinc-400">{file.updated}</td>
                        <td className="py-3 px-2 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            Options
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

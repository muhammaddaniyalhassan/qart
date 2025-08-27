'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Server, Globe, Shield, Zap, Clock } from 'lucide-react'

export default function AdminSettingsPage() {
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    lastUpdated: new Date().toLocaleDateString(),
    databaseStatus: 'Connected',
    stripeStatus: 'Test Mode',
    pusherStatus: 'Active',
    nodeVersion: '18.x',
    nextVersion: '15.5.0',
    uptime: '0 days',
    memoryUsage: '0 MB',
    cpuUsage: '0%'
  })

  useEffect(() => {
    // Simulate fetching system information
    const fetchSystemInfo = async () => {
      try {
        // In a real app, you'd fetch this from your backend
        const mockSystemInfo = {
          ...systemInfo,
          uptime: `${Math.floor(Math.random() * 7)} days`,
          memoryUsage: `${Math.floor(Math.random() * 100)} MB`,
          cpuUsage: `${Math.floor(Math.random() * 20)}%`
        }
        setSystemInfo(mockSystemInfo)
      } catch (error) {
        console.error('Error fetching system info:', error)
      }
    }

    fetchSystemInfo()
    const interval = setInterval(fetchSystemInfo, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Information</h1>
        <p className="text-gray-600">Current system status and technical details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="opacity-100">
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center text-gray-900">
                <Server className="h-5 w-5 mr-2 text-gray-700" />
                System Status
              </CardTitle>
              <CardDescription className="text-gray-600">
                Core system components status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database:</span>
                <span className="font-medium text-gray-900">{systemInfo.databaseStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stripe:</span>
                <span className="font-medium text-gray-900">{systemInfo.stripeStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pusher:</span>
                <span className="font-medium text-gray-900">{systemInfo.pusherStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium text-gray-900">{systemInfo.uptime}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Version Information */}
        <div className="opacity-100">
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center text-gray-900">
                <Database className="h-5 w-5 mr-2 text-gray-700" />
                Version Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Application and framework versions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">App Version:</span>
                <span className="font-medium text-gray-900">{systemInfo.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Next.js:</span>
                <span className="font-medium text-gray-900">{systemInfo.nextVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Node.js:</span>
                <span className="font-medium text-gray-900">{systemInfo.nodeVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium text-gray-900">{systemInfo.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="opacity-100">
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center text-gray-900">
                <Zap className="h-5 w-5 mr-2 text-gray-700" />
                Performance Metrics
              </CardTitle>
              <CardDescription className="text-gray-600">
                Real-time system performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Memory Usage:</span>
                <span className="font-medium text-gray-900">{systemInfo.memoryUsage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CPU Usage:</span>
                <span className="font-medium text-gray-900">{systemInfo.cpuUsage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-medium text-gray-900">~50ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Users:</span>
                <span className="font-medium text-gray-900">0</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Environment Details */}
        <div className="opacity-100">
          <Card className="border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center text-gray-900">
                <Globe className="h-5 w-5 mr-2 text-gray-700" />
                Environment Details
              </CardTitle>
              <CardDescription className="text-gray-600">
                Deployment and environment info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Environment:</span>
                <span className="font-medium text-gray-900">Development</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform:</span>
                <span className="font-medium text-gray-900">Windows</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Architecture:</span>
                <span className="font-medium text-gray-900">x64</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Timezone:</span>
                <span className="font-medium text-gray-900">UTC+5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="opacity-100">
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center text-gray-900">
              <Shield className="h-5 w-5 mr-2 text-gray-700" />
              System Health Summary
            </CardTitle>
            <CardDescription className="text-gray-600">
              Overall system status and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">System Health</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Active Issues</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">✓</div>
                <div className="text-sm text-gray-600">All Systems Operational</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                System information is automatically updated every 30 seconds.
                <br />
                Last refresh: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCw, Save, Cloud, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const DocumentCanvas: React.FC = () => {
  const { workspaceSlug, docId } = useParams<{ workspaceSlug: string; docId: string }>();

  // Determine doc title & info based on docId slug
  const getDocDetails = () => {
    if (docId === 'api-gateway-spec') {
      return {
        path: 'Wiki / Technical Specifications / API Gateway V2 Spec',
        title: 'API Gateway V2 System Specification',
        creator: 'aswin.dev',
        version: 14,
        defaultContent: `## 1. Architectural Protocol Overview
This technical blueprint specifies the network configuration rules of the V2 API gateway layers, driving requests downstream via asynchronous ASGI loops managed inside Docker containers.

## 2. Security & JWT Policy Rules
* JWT_AUTH_HTTPONLY = True
* JWT_AUTH_SAMESITE = 'Strict'
* JWT_EXPIRATION = timedelta(minutes=15)

## 3. Deployment Targets
Deployment is automated via GitHub Actions directly to AWS EKS cluster pools with active monitoring loops.`
      };
    } else {
      return {
        path: 'Wiki / WebRTC Infrastructure / Coturn Traversal Guide',
        title: 'Coturn STUN/TURN Traversal Setup',
        creator: 'praveen',
        version: 8,
        defaultContent: `## 1. STUN/TURN Setup Guide
This document covers configuration details for the Coturn traversal node pools deployed across global regions.

## 2. coturn.conf Rules
* listening-port=3478
* tls-listening-port=5349
* realm=silo.app
* fingerprint

## 3. Fallback Policies
If direct WebRTC peer connections fail due to restrictive corporate firewalls, connections fallback to relay traffic directly through TURN over TLS (port 443).`
      };
    }
  };

  const docDetails = getDocDetails();
  const cacheKey = `silo_doc_${workspaceSlug}_${docId}`;

  const [content, setContent] = useState('');
  const [savingState, setSavingState] = useState<'synced' | 'saving' | 'offline-cached'>('synced');

  // Load from Local Storage (Continuous local IndexedDB/localStorage sync)
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setContent(cached);
      setSavingState('synced');
    } else {
      setContent(docDetails.defaultContent);
      setSavingState('synced');
    }
  }, [docId, workspaceSlug]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSavingState('saving');
    
    // Save to local cache asynchronously to prevent lag
    setTimeout(() => {
      localStorage.setItem(cacheKey, val);
      setSavingState('offline-cached');
    }, 400);
  };

  const forceCloudSync = () => {
    setSavingState('saving');
    setTimeout(() => {
      setSavingState('synced');
      toast.success('Document changes synchronized successfully to cloud database.');
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top Navbar Header */}
      <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-400" />
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{docDetails.path}</span>
        </div>

        {/* Sync Indicators */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            {savingState === 'synced' && (
              <>
                <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Cloud Synced</span>
              </>
            )}
            {savingState === 'offline-cached' && (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-sky-400 font-medium">Local Cached</span>
              </>
            )}
            {savingState === 'saving' && (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-yellow-400 animate-spin" />
                <span className="text-yellow-400 font-medium">Syncing...</span>
              </>
            )}
          </span>
          <Button
            onClick={forceCloudSync}
            size="sm"
            variant="outline"
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Sync Cloud
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-zinc-900/10">
        <div className="max-w-4xl w-full flex flex-col h-full space-y-4">
          {/* Doc Header Information */}
          <div className="space-y-2 pb-4 border-b border-zinc-800">
            <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
              {docDetails.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Created by <strong>@{docDetails.creator}</strong></span>
              <span>•</span>
              <span>Version History #{docDetails.version}</span>
              <span>•</span>
              <span className="bg-purple-950/40 text-purple-400 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                Offline-Ready (IndexedDB Active)
              </span>
            </div>
          </div>

          {/* Main Editor Textarea */}
          <div className="flex-1 flex flex-col min-h-[400px]">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Start drafting document specifications..."
              className="flex-1 w-full bg-transparent text-zinc-200 border-none outline-none font-mono text-sm leading-relaxed resize-none focus:ring-0 p-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

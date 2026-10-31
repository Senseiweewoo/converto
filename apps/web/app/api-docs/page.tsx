'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Key, 
  Cpu, 
  FileText, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface EndpointDoc {
  method: 'POST' | 'GET' | 'DELETE';
  path: string;
  title: string;
  description: string;
  curlSnippet: string;
  jsSnippet: string;
  pythonSnippet: string;
  responseSnippet: string;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    method: 'POST',
    path: '/api/v1/ai/chat',
    title: 'Chat with PDF Document',
    description: 'Queries an indexed PDF document with retrieval grounding and strict bounding-box page citations.',
    curlSnippet: `curl -X POST https://converto.app/api/v1/ai/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "messages": [{ "role": "user", "content": "What is the termination clause?" }],
    "documentText": "Page 1 content... Page 2 content...",
    "mode": "rag"
  }'`,
    jsSnippet: `const res = await fetch('https://converto.app/api/v1/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'What is the termination clause?' }],
    documentText: 'Page 1 content...',
  }),
});
const data = await res.json();
console.log(data.reply, data.citations);`,
    pythonSnippet: `import requests

res = requests.post(
    'https://converto.app/api/v1/ai/chat',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'messages': [{'role': 'user', 'content': 'What is the termination clause?'}],
        'documentText': 'Page 1 content...'
    }
)
print(res.json()['reply'])`,
    responseSnippet: `{
  "reply": "The agreement may be terminated by either party with 30 days prior written notice [Page 3].",
  "citations": [
    { "page": 3, "snippet": "Section 12.1 Termination upon 30 days written notice..." }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/ai/extract',
    title: 'Extract Structured Financial Data',
    description: 'Extracts validated JSON schemas for invoices, receipts, and bank statements with automated arithmetic verification.',
    curlSnippet: `curl -X POST https://converto.app/api/v1/ai/extract \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "documentText": "INVOICE #INV-2024-001 Subtotal: $100 Tax: $10 Total: $110",
    "documentType": "invoice"
  }'`,
    jsSnippet: `const res = await fetch('https://converto.app/api/v1/ai/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    documentText: invoiceRawText,
    documentType: 'invoice',
  }),
});
const { data, mathVerification } = await res.json();
console.log('Subtotal + Tax matches total:', mathVerification.matchesTotal);`,
    pythonSnippet: `import requests

res = requests.post(
    'https://converto.app/api/v1/ai/extract',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={'documentText': invoice_text, 'documentType': 'invoice'}
)
extracted = res.json()
print(extracted['data']['invoiceNumber'], extracted['data']['total'])`,
    responseSnippet: `{
  "documentType": "invoice",
  "data": {
    "invoiceNumber": "INV-2024-001",
    "subtotal": 100,
    "taxAmount": 10,
    "total": 110,
    "lineItems": [{ "description": "Consulting", "quantity": 1, "unitPrice": 100, "total": 100 }]
  },
  "mathVerification": {
    "calculatedTotal": 110,
    "matchesTotal": true
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/share',
    title: 'Create Tokenized Secure Share Link',
    description: 'Generates an end-to-end encrypted or auto-expiring document share link with optional view-only lock.',
    curlSnippet: `curl -X POST https://converto.app/api/v1/share \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "filename": "contract.pdf",
    "dataBase64": "JVBERi0xLjQKJ...",
    "expiryHours": 48,
    "isViewOnly": false,
    "maxDownloads": 5
  }'`,
    jsSnippet: `const res = await fetch('https://converto.app/api/v1/share', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    filename: 'quarterly-report.pdf',
    dataBase64: base64PdfData,
    expiryHours: 24,
  }),
});
const { shareUrl, expiresAt } = await res.json();
console.log('Share Link:', shareUrl);`,
    pythonSnippet: `import requests

res = requests.post(
    'https://converto.app/api/v1/share',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'filename': 'contract.pdf',
        'dataBase64': base64_data,
        'expiryHours': 24
    }
)
print(res.json()['shareUrl'])`,
    responseSnippet: `{
  "success": true,
  "shareId": "c9a41ffb9",
  "shareUrl": "/share/c9a41ffb9",
  "filename": "contract.pdf",
  "expiresAt": "2026-11-03T08:00:00.000Z",
  "maxDownloads": 5,
  "isViewOnly": false
}`,
  },
];

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-4">
          <Terminal className="w-3.5 h-3.5" />
          Developer REST API & CLI v1.0
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Converto Developer API Documentation
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
          Automate PDF processing, structured financial parsing, and AI retrieval in your own backend, apps, or continuous integration pipelines.
        </p>

        {/* API Base & Auth info */}
        <div className="mt-6 p-4 bg-card border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-foreground">API Base URL: </span>
            <code className="px-2 py-1 bg-muted rounded font-mono text-emerald-600 dark:text-emerald-400">
              https://converto.app/api/v1
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Auth:</span>
            <span className="px-2 py-1 bg-muted rounded font-mono">Bearer &lt;TOKEN&gt;</span>
          </div>
        </div>
      </div>

      {/* Language Selector Tab */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Code examples:</span>
          {(['curl', 'js', 'python'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'curl' ? 'cURL' : tab === 'js' ? 'Node / Fetch' : 'Python'}
            </button>
          ))}
        </div>

        <Link
          href="/pricing"
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
        >
          <Key className="w-3.5 h-3.5" /> Get an API Key
        </Link>
      </div>

      {/* Endpoints List */}
      <div className="space-y-12 mb-16">
        {ENDPOINTS.map((endpoint, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Endpoint Header */}
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-600 text-white rounded-md">
                  {endpoint.method}
                </span>
                <span className="font-mono text-sm font-semibold">{endpoint.path}</span>
              </div>
              <h2 className="text-lg font-bold">{endpoint.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{endpoint.description}</p>
            </div>

            {/* Code snippets and Response */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Request Snippet */}
              <div className="p-5 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto relative">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="uppercase tracking-wider text-[10px] font-bold">Request Example</span>
                  <button
                    onClick={() => {
                      const snippet =
                        activeTab === 'curl'
                          ? endpoint.curlSnippet
                          : activeTab === 'js'
                          ? endpoint.jsSnippet
                          : endpoint.pythonSnippet;
                      copyToClipboard(snippet, `${endpoint.path}-${activeTab}`);
                    }}
                    className="p-1 hover:text-white rounded"
                    title="Copy snippet"
                  >
                    {copiedKey === `${endpoint.path}-${activeTab}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="leading-relaxed">
                  {activeTab === 'curl' && endpoint.curlSnippet}
                  {activeTab === 'js' && endpoint.jsSnippet}
                  {activeTab === 'python' && endpoint.pythonSnippet}
                </pre>
              </div>

              {/* Response Snippet */}
              <div className="p-5 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto relative">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="uppercase tracking-wider text-[10px] font-bold">Response 200 OK</span>
                  <button
                    onClick={() => copyToClipboard(endpoint.responseSnippet, `${endpoint.path}-resp`)}
                    className="p-1 hover:text-white rounded"
                    title="Copy response"
                  >
                    {copiedKey === `${endpoint.path}-resp` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="text-emerald-400 leading-relaxed">{endpoint.responseSnippet}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CLI Section */}
      <div className="p-8 bg-card border border-border rounded-2xl shadow-sm mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold">Converto Command-Line Interface (CLI)</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Process, merge, compress, and inspect PDF files directly from your terminal or shell scripts without launching a browser.
        </p>

        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-xl space-y-3">
          <div>
            <span className="text-slate-500"># 1. Install CLI globally or execute via npx</span>
            <div className="text-emerald-400">npm install -g @converto/cli</div>
          </div>
          <div>
            <span className="text-slate-500"># 2. Merge multiple PDF files</span>
            <div>converto merge doc1.pdf doc2.pdf -o combined.pdf</div>
          </div>
          <div>
            <span className="text-slate-500"># 3. Compress PDF file to extreme compression preset</span>
            <div>converto compress report.pdf -o report.min.pdf --level extreme</div>
          </div>
          <div>
            <span className="text-slate-500"># 4. Split PDF file by page ranges</span>
            <div>converto split contract.pdf --pages 1-3,5 -o page-chunk.pdf</div>
          </div>
        </div>
      </div>
    </div>
  );
}

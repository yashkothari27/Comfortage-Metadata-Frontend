"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ImageIcon, Hash, Code2, Send, Eye, Search, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface MetadataEntry {
  id?: string
  name: string
  image: string
  attributes: any
  storeOnChain: boolean
  storeLocal?: boolean
}

export default function MetadataStore() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://comfortage-metadata-backend.onrender.com"
  const [metadata, setMetadata] = useState<MetadataEntry>({
    name: "",
    image: "",
    attributes: {},
    storeOnChain: true,
    storeLocal: false,
  })

  const [jsonInput, setJsonInput] = useState('{"name":"","image":"","attributes":[]}')
  const [apiResponse, setApiResponse] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [retrieveResult, setRetrieveResult] = useState<string>("")
  const [retrieved, setRetrieved] = useState<{ id: string; data: any; submitter?: string; source?: string } | null>(null)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiChecking, setApiChecking] = useState(true)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [apiInfo, setApiInfo] = useState<{ chainId?: number; rpc?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      let parsed: any = null
      try {
        parsed = JSON.parse(jsonInput)
      } catch {}

      const payload = parsed && typeof parsed === "object"
        ? { id: metadata.id, data: parsed, storeOnChain: metadata.storeOnChain, storeLocal: metadata.storeLocal }
        : {
            id: metadata.id,
            name: metadata.name,
            image: metadata.image,
            attributes: parsed ?? metadata.attributes,
            storeOnChain: metadata.storeOnChain,
            storeLocal: metadata.storeLocal,
          }

      const res = await fetch(`${API_BASE_URL}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let display = text
      try {
        display = JSON.stringify(JSON.parse(text), null, 2)
      } catch {}
      setApiResponse(display)
      if (res.ok) {
        toast({ title: "Saved", description: "Metadata submitted successfully" })
      } else {
        toast({ title: "Submit failed", description: "Server returned an error" })
      }
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err?.message || "Request failed" }, null, 2))
      toast({ title: "Submit failed", description: err?.message || "Network error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateJsonPreview = () => {
    const preview = {
      name: metadata.name || "",
      image: metadata.image || "",
      attributes: metadata.attributes || [],
      storeOnChain: metadata.storeOnChain,
    }
    setJsonInput(JSON.stringify(preview, null, 2))
  }

  const handleRetrieve = async () => {
    if (!searchQuery.trim()) return
    setIsRetrieving(true)
    setRetrieveResult("")
    setRetrieved(null)
    try {
      const res = await fetch(`${API_BASE_URL}/metadata/${encodeURIComponent(searchQuery.trim())}`)
      const text = await res.text()
      setRetrieveResult(text)
      if (res.ok) {
        try {
          const json = JSON.parse(text)
          setRetrieved(json)
        } catch {}
      }
    } catch (err: any) {
      setRetrieveResult(JSON.stringify({ error: err?.message || "Request failed" }, null, 2))
    } finally {
      setIsRetrieving(false)
    }
  }

  const handleLoadToForm = () => {
    if (!retrieved) return
    const data = retrieved.data || {}
    const next: MetadataEntry = {
      id: retrieved.id,
      name: typeof data.name === "string" ? data.name : "",
      image: typeof data.image === "string" ? data.image : "",
      attributes: data.attributes ?? data,
      storeOnChain: metadata.storeOnChain,
    } as MetadataEntry
    setMetadata(next)
    setJsonInput(JSON.stringify(data, null, 2))
  }

  const checkApi = async () => {
    try {
      setApiChecking(true)
      const res = await fetch(`${API_BASE_URL}/health`)
      const json = await res.json()
      setApiOk(!!json?.ok)
      setApiInfo({ chainId: json?.chainId, rpc: json?.rpc })
    } catch {
      setApiOk(false)
      setApiInfo(null)
    } finally {
      setApiChecking(false)
    }
  }

  useEffect(() => {
    checkApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-pattern">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-56 sm:h-16 sm:w-64 lg:h-20 lg:w-72 items-center justify-center">
              <Image
                src="/comfortage-logo.svg"
                alt="Comfortage Logo"
                fill
                sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, 288px"
                priority
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-balance">Metadata Store</h1>
              <p className="text-muted-foreground text-pretty">
                Create and manage your digital asset metadata with ease
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {apiChecking && <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking API…</span>}
                {!apiChecking && apiOk === false && <span>API offline</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Retrieve Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-primary" />
                  Retrieve Metadata
                </CardTitle>
                <CardDescription>Search and retrieve existing metadata entries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter metadata ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <Button onClick={handleRetrieve} disabled={isRetrieving} className="bg-primary/90">
                    <Search className="mr-2 h-4 w-4" />
                    {isRetrieving ? "Searching..." : "Search"}
                  </Button>
                </div>
                {retrieveResult && (
                  <div className="rounded-lg bg-muted p-4 max-h-72 overflow-auto">
                    <pre className="text-sm font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">{retrieveResult}</pre>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleLoadToForm} disabled={!retrieved}>
                    Load to Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Form Section */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Hash className="h-5 w-5 text-primary" />
                  Create / Update Metadata
                </CardTitle>
                <CardDescription>Fill in the details below to create or update your metadata entry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id" className="text-sm font-medium">
                        Optional ID
                      </Label>
                      <Input
                        id="id"
                        placeholder="auto hash if blank"
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => setMetadata({ ...metadata, id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">bytes32 or plain string</p>
                    </div>

                <div className="space-y-2">
                  {(() => {
                    let jsonValid = false
                    try {
                      const p = JSON.parse(jsonInput)
                      jsonValid = p && typeof p === "object"
                    } catch {}
                    const isNameRequired = !jsonValid
                    return (
                      <>
                        <Label htmlFor="name" className="text-sm font-medium">
                          {`Name${isNameRequired ? " *" : ""}`}
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter name"
                          required={isNameRequired}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => {
                            setMetadata({ ...metadata, name: e.target.value })
                            updateJsonPreview()
                          }}
                        />
                      </>
                    )
                  })()}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image" className="flex items-center gap-2 text-sm font-medium">
                        <ImageIcon className="h-4 w-4" />
                        Image URL
                      </Label>
                      <Input
                        id="image"
                        placeholder="https://..."
                        type="url"
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                        onChange={(e) => {
                          setMetadata({ ...metadata, image: e.target.value })
                          updateJsonPreview()
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Attributes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Attributes</Label>
                      <Badge variant="secondary" className="text-xs">
                        Custom JSON
                      </Badge>
                    </div>
                    <Textarea
                      placeholder='{"name":"","image":"","attributes":[]}'
                      className="min-h-[120px] font-mono text-sm transition-all focus:ring-2 focus:ring-primary/20"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">overrides fields above if present</p>
                  </div>

                  <Separator />

                  {/* Storage Options */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="storeOnChain"
                        checked={metadata.storeOnChain}
                        onCheckedChange={(checked) => setMetadata({ ...metadata, storeOnChain: checked as boolean })}
                      />
                      <Label htmlFor="storeOnChain" className="text-sm font-medium">
                        Store on-chain
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="storeLocal"
                        checked={!!metadata.storeLocal}
                        onCheckedChange={(checked) => setMetadata({ ...metadata, storeLocal: checked as boolean })}
                      />
                      <Label htmlFor="storeLocal" className="text-sm font-medium">
                        Also store locally
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Metadata
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {/* Live Preview */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Eye className="h-5 w-5 text-primary" />
                  Live Preview
                </CardTitle>
                <CardDescription>Real-time preview of your metadata structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">{jsonInput}</pre>
                </div>
              </CardContent>
            </Card>

            {/* API Response */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Code2 className="h-5 w-5 text-primary" />
                  API Response
                </CardTitle>
                <CardDescription>Server response will appear here after submission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 min-h-[120px] max-h-72 overflow-auto">
                  <pre className="text-sm font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                    {apiResponse || "// API response will appear here\n// Try submitting some metadata!"}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

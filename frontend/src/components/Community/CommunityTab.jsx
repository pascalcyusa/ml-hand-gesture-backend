import { useState, useEffect, useCallback } from "react";
import {
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CubeIcon,
  MusicalNoteIcon,
  CogIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui/button.jsx";
import { Card } from "../ui/card.jsx";
import { Input } from "../ui/input.jsx";
import { Badge } from "../ui/badge.jsx";
import "./CommunityTab.css";

export default function CommunityTab({
  auth,
  onImportModel,
  onImportPiano,
  onImportGesture,
  showToast,
}) {
  const [models, setModels] = useState([]);
  const [pianos, setPianos] = useState([]);
  const [gestures, setGestures] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(null);

  const [expanded, setExpanded] = useState({
    models: true,
    piano: true,
    gestures: true,
  });

  const toggleSection = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");
      const queryString = params.toString();

      // Use API_BASE_URL for production-safe backend requests
      import { API_BASE_URL } from "../../config";
      const [modelsRes, pianoRes, gesturesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/models/community?${queryString}`),
        fetch(`${API_BASE_URL}/piano/community?${queryString}`),
        fetch(`${API_BASE_URL}/gestures/community?${queryString}`),
      ]);

      if (modelsRes.ok) setModels(await modelsRes.json());
      if (pianoRes.ok) setPianos(await pianoRes.json());
      if (gesturesRes.ok) setGestures(await gesturesRes.json());
    } catch (err) {
      console.error("Failed to fetch community assets:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleImport = useCallback(
    async (type, id, name) => {
      setImporting(id);
      try {
        if (type === "model") {
          const res = await fetch(`/api/models/${id}`);
          if (!res.ok) throw new Error("Failed to fetch model");
          const data = await res.json();
          if (onImportModel) await onImportModel(data);
        } else if (type === "piano") {
          const item = pianos.find((p) => p.id === id);
          if (item && onImportPiano) await onImportPiano(item);
        } else if (type === "gesture") {
          const item = gestures.find((g) => g.id === id);
          if (item && onImportGesture) await onImportGesture(item);
        }
      } catch (err) {
        showToast(`Import failed: ${err.message}`, "error");
      } finally {
        setImporting(null);
      }
    },
    [
      onImportModel,
      onImportPiano,
      onImportGesture,
      pianos,
      gestures,
      showToast,
    ],
  );

  const renderCard = (item, type, icon, badgeVariant) => (
    <Card key={`${type}-${item.id}`} className="community-card">
      <div className="community-card-header">
        <h4 className="font-bold">{item.name_or_title || item.name}</h4>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--fg-muted)]">
          <span>by {item.author || "Community Member"}</span>
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-[var(--fg-dim)] leading-relaxed">
          {item.description}
        </p>
      )}

      {type === "model" && (
        <div className="flex flex-wrap gap-1">
          {item.class_names.map((cls, i) => (
            <Badge key={i} variant={badgeVariant}>
              {cls}
            </Badge>
          ))}
        </div>
      )}

      <div className="community-card-footer">
        <span className="text-[0.7rem] font-mono text-[var(--fg-muted)]">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            handleImport(type, item.id, item.name || item.name_or_title)
          }
          disabled={importing === item.id}
        >
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          {importing === item.id ? "Importing..." : "Import"}
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="community-tab animate-fade-in space-y-8 pb-10">
      <div className="community-header">
        <div className="community-header-text">
          <h2 className="flex items-center gap-2">
            <GlobeAltIcon className="h-6 w-6 text-[var(--gold)]" />
            Community
          </h2>
          <p className="community-subtitle">
            Browse and import assets shared by the community
          </p>
        </div>
      </div>

      <Card className="flex items-center gap-4 py-3 px-4 sticky top-4 z-10 glass-panel shadow-lg">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
          <Input
            className="pl-9"
            placeholder="Search community assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 text-xs font-mono text-[var(--fg-muted)] whitespace-nowrap">
          <span>{models.length} Models</span>
          <span>{pianos.length} Piano</span>
          <span>{gestures.length} Motors</span>
        </div>
      </Card>

      {loading ? (
        <div className="community-loading">
          <div className="spinner" />
          <span>Loading assets...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Models Section */}
          <section className="space-y-4">
            <button
              onClick={() => toggleSection("models")}
              className="w-full flex items-center justify-between group hover:bg-[var(--bg-surface-hover)] p-2 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--gold)]">
                <CubeIcon className="w-5 h-5" /> Models
                <span className="text-xs font-mono text-[var(--fg-muted)] ml-2 opacity-50">
                  ({models.length})
                </span>
              </h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-[var(--fg-muted)] transition-transform duration-200 ${expanded.models ? "rotate-180" : ""}`}
              />
            </button>

            {expanded.models &&
              (models.length === 0 ? (
                <p className="text-[var(--fg-muted)] italic px-2">
                  No models found.
                </p>
              ) : (
                <div className="community-grid">
                  {models.map((m) => renderCard(m, "model", null, "info"))}
                </div>
              ))}
          </section>

          {/* Piano Section */}
          <section className="space-y-4">
            <button
              onClick={() => toggleSection("piano")}
              className="w-full flex items-center justify-between group hover:bg-[var(--bg-surface-hover)] p-2 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--violet)]">
                <MusicalNoteIcon className="w-5 h-5" /> Piano Sequences
                <span className="text-xs font-mono text-[var(--fg-muted)] ml-2 opacity-50">
                  ({pianos.length})
                </span>
              </h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-[var(--fg-muted)] transition-transform duration-200 ${expanded.piano ? "rotate-180" : ""}`}
              />
            </button>

            {expanded.piano &&
              (pianos.length === 0 ? (
                <p className="text-[var(--fg-muted)] italic px-2">
                  No piano sequences found.
                </p>
              ) : (
                <div className="community-grid">
                  {pianos.map((p) => renderCard(p, "piano", null, "violet"))}
                </div>
              ))}
          </section>

          {/* Motors Section */}
          <section className="space-y-4">
            <button
              onClick={() => toggleSection("gestures")}
              className="w-full flex items-center justify-between group hover:bg-[var(--bg-surface-hover)] p-2 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--cyan)]">
                <CogIcon className="w-5 h-5" /> Motor Configurations
                <span className="text-xs font-mono text-[var(--fg-muted)] ml-2 opacity-50">
                  ({gestures.length})
                </span>
              </h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-[var(--fg-muted)] transition-transform duration-200 ${expanded.gestures ? "rotate-180" : ""}`}
              />
            </button>

            {expanded.gestures &&
              (gestures.length === 0 ? (
                <p className="text-[var(--fg-muted)] italic px-2">
                  No motor configurations found.
                </p>
              ) : (
                <div className="community-grid">
                  {gestures.map((g) => renderCard(g, "gesture", null, "cyan"))}
                </div>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  MediaBacklogItem, 
  MediaReviewItem, 
  GameBacklogItem, 
  MediaType, 
  MediaStatus, 
  MediaPriority, 
  GameStatus, 
  GamePriority 
} from '../types';
import {
  Tv,
  Film,
  Gamepad2,
  Star,
  Plus,
  Search,
  Filter,
  Play,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Tag,
  Check,
  Flame,
  Award,
  BookOpen,
  Monitor,
  Heart,
  TrendingUp,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
  Quote,
  Layers,
  ChevronRight,
  Eye,
  Calendar,
  X,
  Trophy,
  Medal,
  Crown,
  ListOrdered,
  History
} from 'lucide-react';

interface EntertainmentHubViewProps {
  mediaBacklog: MediaBacklogItem[];
  gameBacklog: GameBacklogItem[];
  mediaReviews: MediaReviewItem[];
  onAddMediaBacklog: (item: Omit<MediaBacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMediaBacklog: (item: MediaBacklogItem) => void;
  onDeleteMediaBacklog: (itemId: string) => void;
  onAddGameBacklog: (item: Omit<GameBacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateGameBacklog: (item: GameBacklogItem) => void;
  onDeleteGameBacklog: (gameId: string) => void;
  onAddMediaReview: (item: Omit<MediaReviewItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMediaReview: (item: MediaReviewItem) => void;
  onDeleteMediaReview: (reviewId: string) => void;
  onResetEntertainmentData?: () => void;
  onOpenNewTaskModal?: (initialCategory?: string, initialTitle?: string) => void;
}

export const EntertainmentHubView: React.FC<EntertainmentHubViewProps> = ({
  mediaBacklog,
  gameBacklog,
  mediaReviews,
  onAddMediaBacklog,
  onUpdateMediaBacklog,
  onDeleteMediaBacklog,
  onAddGameBacklog,
  onUpdateGameBacklog,
  onDeleteGameBacklog,
  onAddMediaReview,
  onUpdateMediaReview,
  onDeleteMediaReview,
  onResetEntertainmentData,
  onOpenNewTaskModal,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'media_backlog' | 'game_backlog' | 'top10_ranked' | 'watched_log' | 'media_reviews'>('media_backlog');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [selectedMediaStatus, setSelectedMediaStatus] = useState<string>('all');
  const [selectedMediaPlatform, setSelectedMediaPlatform] = useState<string>('all');

  const [selectedGamePlatform, setSelectedGamePlatform] = useState<string>('all');
  const [selectedGameStatus, setSelectedGameStatus] = useState<string>('all');

  const [selectedReviewRating, setSelectedReviewRating] = useState<number | 'all'>('all');
  const [top10TypeFilter, setTop10TypeFilter] = useState<'all' | 'pelicula' | 'serie'>('all');
  const [top10MinRating, setTop10MinRating] = useState<number | 'all'>('all');

  // Modal States
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaBacklogItem | null>(null);

  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameBacklogItem | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<MediaReviewItem | null>(null);

  // Form states for Media Backlog
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('pelicula');
  const [mediaPlatform, setMediaPlatform] = useState('Netflix');
  const [mediaGenre, setMediaGenre] = useState('');
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>('pendiente');
  const [mediaPriority, setMediaPriority] = useState<MediaPriority>('alta');
  const [mediaDuration, setMediaDuration] = useState('');
  const [mediaCurrentSeason, setMediaCurrentSeason] = useState('');
  const [mediaYear, setMediaYear] = useState<number>(2025);
  const [mediaEmoji, setMediaEmoji] = useState('🎬');
  const [mediaNotes, setMediaNotes] = useState('');
  const [mediaTagsInput, setMediaTagsInput] = useState('');

  // Form states for Game Backlog
  const [gameTitle, setGameTitle] = useState('');
  const [gamePlatform, setGamePlatform] = useState('PC / Steam');
  const [gameGenre, setGameGenre] = useState('Action RPG');
  const [gameStatus, setGameStatus] = useState<GameStatus>('pendiente');
  const [gamePriority, setGamePriority] = useState<GamePriority>('alta');
  const [gameEstimatedHours, setGameEstimatedHours] = useState<number>(30);
  const [gamePlayedHours, setGamePlayedHours] = useState<number>(0);
  const [gameScore, setGameScore] = useState<number | undefined>(undefined);
  const [gameAchievements, setGameAchievements] = useState('');
  const [gameEmoji, setGameEmoji] = useState('🎮');
  const [gameNotes, setGameNotes] = useState('');

  // Form states for Media Review
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewType, setReviewType] = useState<MediaType>('pelicula');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewPlatform, setReviewPlatform] = useState('Netflix');
  const [reviewGenre, setReviewGenre] = useState('');
  const [reviewQuote, setReviewQuote] = useState('');
  const [reviewRecommend, setReviewRecommend] = useState(true);
  const [reviewEmoji, setReviewEmoji] = useState('🍿');
  const [linkedBacklogId, setLinkedBacklogId] = useState<string | undefined>(undefined);

  // Common platform lists
  const streamingPlatforms = ['Netflix', 'Max', 'Prime Video', 'Disney+', 'Apple TV+', 'Paramount+', 'Crunchyroll', 'Cine', 'YouTube', 'Otro'];
  const gamingPlatforms = ['PC / Steam', 'PlayStation 5', 'PlayStation 4', 'Nintendo Switch', 'Xbox Series X/S', 'Xbox Game Pass', 'Retro / Emulador', 'Móvil', 'Otro'];

  // Metrics Calculations
  const mediaPendingCount = mediaBacklog.filter(m => m.status === 'pendiente').length;
  const mediaWatchingCount = mediaBacklog.filter(m => m.status === 'viendo').length;
  const gamesPlayingCount = gameBacklog.filter(g => g.status === 'jugando').length;
  const gamesPendingCount = gameBacklog.filter(g => g.status === 'pendiente').length;
  const totalReviewsCount = mediaReviews.length;
  const averageRating = totalReviewsCount > 0 
    ? (mediaReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  // Filtered Media Backlog
  const filteredMedia = useMemo(() => {
    return mediaBacklog.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.genre && item.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesType = selectedMediaType === 'all' || item.type === selectedMediaType;
      const matchesStatus = selectedMediaStatus === 'all' || item.status === selectedMediaStatus;
      const matchesPlatform = selectedMediaPlatform === 'all' || item.platform.toLowerCase() === selectedMediaPlatform.toLowerCase();

      return matchesSearch && matchesType && matchesStatus && matchesPlatform;
    });
  }, [mediaBacklog, searchQuery, selectedMediaType, selectedMediaStatus, selectedMediaPlatform]);

  // Filtered Games
  const filteredGames = useMemo(() => {
    return gameBacklog.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.notes && game.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPlatform = selectedGamePlatform === 'all' || game.platform.toLowerCase().includes(selectedGamePlatform.toLowerCase());
      const matchesStatus = selectedGameStatus === 'all' || game.status === selectedGameStatus;

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [gameBacklog, searchQuery, selectedGamePlatform, selectedGameStatus]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return mediaReviews.filter((review) => {
      const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (review.review && review.review.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (review.genre && review.genre.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRating = selectedReviewRating === 'all' || review.rating === selectedReviewRating;
      const matchesType = selectedMediaType === 'all' || review.type === selectedMediaType;

      return matchesSearch && matchesRating && matchesType;
    });
  }, [mediaReviews, searchQuery, selectedReviewRating, selectedMediaType]);

  // Top 10 Ranked by Stars & Date
  const top10Media = useMemo(() => {
    return [...mediaReviews]
      .filter((r) => {
        const matchesType = top10TypeFilter === 'all' || r.type === top10TypeFilter;
        const matchesMinRating = top10MinRating === 'all' || r.rating >= top10MinRating;
        const matchesSearch = searchQuery.trim() === '' || 
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.genre && r.genre.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesMinRating && matchesSearch;
      })
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime();
      })
      .slice(0, 10);
  }, [mediaReviews, top10TypeFilter, top10MinRating, searchQuery]);

  // Chronological Log of Watched Movies/Series (Most recent first)
  const chronologicalWatchedLog = useMemo(() => {
    return [...mediaReviews]
      .filter((review) => {
        const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (review.review && review.review.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (review.genre && review.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (review.platform && review.platform.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRating = selectedReviewRating === 'all' || review.rating === selectedReviewRating;
        const matchesType = selectedMediaType === 'all' || review.type === selectedMediaType;

        return matchesSearch && matchesRating && matchesType;
      })
      .sort((a, b) => new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime());
  }, [mediaReviews, searchQuery, selectedReviewRating, selectedMediaType]);

  // Grouped by Month/Year for Timeline
  const groupedChronologicalLog = useMemo(() => {
    const groups: { [key: string]: MediaReviewItem[] } = {};

    chronologicalWatchedLog.forEach((item) => {
      if (!item.watchedDate) {
        const key = 'Sin fecha registrada';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return;
      }

      const parts = item.watchedDate.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const months = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const monthName = months[monthNum - 1] || 'Mes';
        const key = `${monthName} ${year}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      } else {
        const key = item.watchedDate;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
    });

    return groups;
  }, [chronologicalWatchedLog]);

  // Star Distribution
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    mediaReviews.forEach(r => {
      if (counts[r.rating as keyof typeof counts] !== undefined) {
        counts[r.rating as keyof typeof counts]++;
      }
    });
    return counts;
  }, [mediaReviews]);

  // Handler: Open Add Media Modal
  const handleOpenAddMedia = () => {
    setEditingMedia(null);
    setMediaTitle('');
    setMediaType('pelicula');
    setMediaPlatform('Netflix');
    setMediaGenre('');
    setMediaStatus('pendiente');
    setMediaPriority('alta');
    setMediaDuration('');
    setMediaCurrentSeason('');
    setMediaYear(2025);
    setMediaEmoji('🎬');
    setMediaNotes('');
    setMediaTagsInput('');
    setIsMediaModalOpen(true);
  };

  // Handler: Open Edit Media Modal
  const handleOpenEditMedia = (item: MediaBacklogItem) => {
    setEditingMedia(item);
    setMediaTitle(item.title);
    setMediaType(item.type);
    setMediaPlatform(item.platform);
    setMediaGenre(item.genre || '');
    setMediaStatus(item.status);
    setMediaPriority(item.priority);
    setMediaDuration(item.totalDurationOrSeasons || '');
    setMediaCurrentSeason(item.currentSeasonOrEpisode || '');
    setMediaYear(item.releaseYear || 2025);
    setMediaEmoji(item.coverEmoji || '🎬');
    setMediaNotes(item.notes || '');
    setMediaTagsInput(item.tags ? item.tags.join(', ') : '');
    setIsMediaModalOpen(true);
  };

  // Handler: Save Media
  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) return;

    const tagsArray = mediaTagsInput
      ? mediaTagsInput.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    if (editingMedia) {
      onUpdateMediaBacklog({
        ...editingMedia,
        title: mediaTitle.trim(),
        type: mediaType,
        platform: mediaPlatform,
        genre: mediaGenre.trim() || undefined,
        status: mediaStatus,
        priority: mediaPriority,
        totalDurationOrSeasons: mediaDuration.trim() || undefined,
        currentSeasonOrEpisode: mediaCurrentSeason.trim() || undefined,
        releaseYear: mediaYear || undefined,
        coverEmoji: mediaEmoji || '🎬',
        notes: mediaNotes.trim() || undefined,
        tags: tagsArray,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddMediaBacklog({
        title: mediaTitle.trim(),
        type: mediaType,
        platform: mediaPlatform,
        genre: mediaGenre.trim() || undefined,
        status: mediaStatus,
        priority: mediaPriority,
        totalDurationOrSeasons: mediaDuration.trim() || undefined,
        currentSeasonOrEpisode: mediaCurrentSeason.trim() || undefined,
        releaseYear: mediaYear || undefined,
        coverEmoji: mediaEmoji || '🎬',
        notes: mediaNotes.trim() || undefined,
        tags: tagsArray,
      });
    }

    setIsMediaModalOpen(false);
  };

  // Handler: Open Add Game Modal
  const handleOpenAddGame = () => {
    setEditingGame(null);
    setGameTitle('');
    setGamePlatform('PC / Steam');
    setGameGenre('Action RPG');
    setGameStatus('pendiente');
    setGamePriority('alta');
    setGameEstimatedHours(30);
    setGamePlayedHours(0);
    setGameScore(undefined);
    setGameAchievements('');
    setGameEmoji('🎮');
    setGameNotes('');
    setIsGameModalOpen(true);
  };

  // Handler: Open Edit Game Modal
  const handleOpenEditGame = (game: GameBacklogItem) => {
    setEditingGame(game);
    setGameTitle(game.title);
    setGamePlatform(game.platform);
    setGameGenre(game.genre);
    setGameStatus(game.status);
    setGamePriority(game.priority);
    setGameEstimatedHours(game.estimatedHours || 0);
    setGamePlayedHours(game.playedHours || 0);
    setGameScore(game.scoreOrRating);
    setGameAchievements(game.achievementsProgress || '');
    setGameEmoji(game.coverEmoji || '🎮');
    setGameNotes(game.notes || '');
    setIsGameModalOpen(true);
  };

  // Handler: Save Game
  const handleSaveGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) return;

    if (editingGame) {
      onUpdateGameBacklog({
        ...editingGame,
        title: gameTitle.trim(),
        platform: gamePlatform,
        genre: gameGenre.trim(),
        status: gameStatus,
        priority: gamePriority,
        estimatedHours: gameEstimatedHours > 0 ? gameEstimatedHours : undefined,
        playedHours: gamePlayedHours >= 0 ? gamePlayedHours : undefined,
        scoreOrRating: gameScore,
        achievementsProgress: gameAchievements.trim() || undefined,
        coverEmoji: gameEmoji || '🎮',
        notes: gameNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddGameBacklog({
        title: gameTitle.trim(),
        platform: gamePlatform,
        genre: gameGenre.trim(),
        status: gameStatus,
        priority: gamePriority,
        estimatedHours: gameEstimatedHours > 0 ? gameEstimatedHours : undefined,
        playedHours: gamePlayedHours >= 0 ? gamePlayedHours : undefined,
        scoreOrRating: gameScore,
        achievementsProgress: gameAchievements.trim() || undefined,
        coverEmoji: gameEmoji || '🎮',
        notes: gameNotes.trim() || undefined,
      });
    }

    setIsGameModalOpen(false);
  };

  // Handler: Quick Convert Media Item to Watched & Review
  const handleMarkAsWatchedAndReview = (item: MediaBacklogItem) => {
    setEditingReview(null);
    setReviewTitle(item.title);
    setReviewType(item.type);
    setReviewPlatform(item.platform);
    setReviewGenre(item.genre || '');
    setReviewDate(new Date().toISOString().split('T')[0]);
    setReviewRating(5);
    setReviewText('');
    setReviewQuote('');
    setReviewRecommend(true);
    setReviewEmoji(item.coverEmoji || '🍿');
    setLinkedBacklogId(item.id);
    setIsReviewModalOpen(true);
  };

  // Handler: Open Add Review Modal
  const handleOpenAddReview = () => {
    setEditingReview(null);
    setReviewTitle('');
    setReviewType('pelicula');
    setReviewPlatform('Netflix');
    setReviewGenre('');
    setReviewDate(new Date().toISOString().split('T')[0]);
    setReviewRating(5);
    setReviewText('');
    setReviewQuote('');
    setReviewRecommend(true);
    setReviewEmoji('🍿');
    setLinkedBacklogId(undefined);
    setIsReviewModalOpen(true);
  };

  // Handler: Open Edit Review Modal
  const handleOpenEditReview = (review: MediaReviewItem) => {
    setEditingReview(review);
    setReviewTitle(review.title);
    setReviewType(review.type);
    setReviewPlatform(review.platform || 'Netflix');
    setReviewGenre(review.genre || '');
    setReviewDate(review.watchedDate);
    setReviewRating(review.rating);
    setReviewText(review.review || '');
    setReviewQuote(review.favoriteMomentOrQuote || '');
    setReviewRecommend(review.wouldRecommend);
    setReviewEmoji(review.coverEmoji || '🍿');
    setLinkedBacklogId(review.mediaBacklogId);
    setIsReviewModalOpen(true);
  };

  // Handler: Save Review
  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim()) return;

    if (editingReview) {
      onUpdateMediaReview({
        ...editingReview,
        title: reviewTitle.trim(),
        type: reviewType,
        watchedDate: reviewDate,
        rating: reviewRating,
        review: reviewText.trim() || undefined,
        platform: reviewPlatform || undefined,
        genre: reviewGenre.trim() || undefined,
        favoriteMomentOrQuote: reviewQuote.trim() || undefined,
        wouldRecommend: reviewRecommend,
        coverEmoji: reviewEmoji || '🍿',
        mediaBacklogId: linkedBacklogId,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddMediaReview({
        title: reviewTitle.trim(),
        type: reviewType,
        watchedDate: reviewDate,
        rating: reviewRating,
        review: reviewText.trim() || undefined,
        platform: reviewPlatform || undefined,
        genre: reviewGenre.trim() || undefined,
        favoriteMomentOrQuote: reviewQuote.trim() || undefined,
        wouldRecommend: reviewRecommend,
        coverEmoji: reviewEmoji || '🍿',
        mediaBacklogId: linkedBacklogId,
      });

      // If linked to a backlog item, optionally update its status to completada
      if (linkedBacklogId) {
        const found = mediaBacklog.find(m => m.id === linkedBacklogId);
        if (found && found.status !== 'completada') {
          onUpdateMediaBacklog({
            ...found,
            status: 'completada',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    setIsReviewModalOpen(false);
  };

  // Helper for Star Rating Render
  const renderStarRating = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          return (
            <button
              key={star}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onSelect && onSelect(star)}
              className={`${interactive ? 'cursor-pointer hover:scale-125 transition-transform p-0.5' : 'cursor-default'}`}
            >
              <Star
                className={`w-5 h-5 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div id="entertainment-hub-container" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Quick Metrics */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#1b152b] via-[#131122] to-[#0f172a] border-pink-500/20'
          : 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border-pink-200 shadow-pink-950/5'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border ${
              isDark
                ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                : 'bg-pink-100 border-pink-300 text-pink-800'
            }`}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>ZONA DE OCIO & GAMING</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>🍿 Películas, Series & Videojuegos</span>
              <span className="text-xl">🎮</span>
            </h2>
            <p className={`text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Organiza tu lista de pendientes, gestiona tus videojuegos y califica con 5 estrellas las producciones que has disfrutado con tus reseñas personales.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="btn-add-media-top"
              type="button"
              onClick={handleOpenAddMedia}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-lg shadow-pink-500/25 transition-all flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>+ Película / Serie</span>
            </button>

            <button
              id="btn-add-game-top"
              type="button"
              onClick={handleOpenAddGame}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>+ Videojuego</span>
            </button>

            <button
              id="btn-add-review-top"
              type="button"
              onClick={handleOpenAddReview}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>+ Calificar / Reseña</span>
            </button>

            {onResetEntertainmentData && (
              <button
                id="btn-reset-entertainment"
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas reiniciar y limpiar todos los datos de Ocio & Videojuegos para comenzar desde cero?')) {
                    onResetEntertainmentData();
                  }
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-700 hover:border-rose-500/40'
                    : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200 hover:border-rose-300 shadow-sm'
                }`}
                title="Limpiar datos de ocio (Fresh Start)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className={`backdrop-blur-md p-3.5 rounded-2xl border flex items-center space-x-3 ${
            isDark ? 'bg-[#181329]/80 border-pink-500/20' : 'bg-white/90 border-pink-200 shadow-sm'
          }`}>
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Por Ver / Cine</p>
              <p className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{mediaPendingCount} <span className="text-xs text-slate-400 font-normal">obras</span></p>
            </div>
          </div>

          <div className={`backdrop-blur-md p-3.5 rounded-2xl border flex items-center space-x-3 ${
            isDark ? 'bg-[#181329]/80 border-purple-500/20' : 'bg-white/90 border-purple-200 shadow-sm'
          }`}>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Viendo Actualmente</p>
              <p className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{mediaWatchingCount} <span className="text-xs text-slate-400 font-normal">series</span></p>
            </div>
          </div>

          <div className={`backdrop-blur-md p-3.5 rounded-2xl border flex items-center space-x-3 ${
            isDark ? 'bg-[#181329]/80 border-cyan-500/20' : 'bg-white/90 border-cyan-200 shadow-sm'
          }`}>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Jugando Ahora</p>
              <p className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{gamesPlayingCount} <span className="text-xs text-slate-400 font-normal">juegos</span></p>
            </div>
          </div>

          <div className={`backdrop-blur-md p-3.5 rounded-2xl border flex items-center space-x-3 ${
            isDark ? 'bg-[#181329]/80 border-amber-500/20' : 'bg-white/90 border-amber-200 shadow-sm'
          }`}>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className={`text-[11px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vistas & Reseñas</p>
              <p className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{totalReviewsCount} <span className="text-xs text-slate-400 font-normal">({averageRating} ★)</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Switcher */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl border transition-all ${
        isDark ? 'bg-[#101729] border-slate-800' : 'bg-slate-100/90 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            id="tab-media-backlog"
            type="button"
            onClick={() => setActiveTab('media_backlog')}
            className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'media_backlog'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#17223b]'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>🎬 Por Ver ({mediaBacklog.length})</span>
          </button>

          <button
            id="tab-game-backlog"
            type="button"
            onClick={() => setActiveTab('game_backlog')}
            className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'game_backlog'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#17223b]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>🎮 Videojuegos ({gameBacklog.length})</span>
          </button>

          <button
            id="tab-top10-ranked"
            type="button"
            onClick={() => setActiveTab('top10_ranked')}
            className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'top10_ranked'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-[#17223b]'
            }`}
          >
            <Trophy className="w-4 h-4 text-slate-950 fill-current" />
            <span>🏆 Top 10 Clasificadas (★)</span>
          </button>

          <button
            id="tab-watched-log"
            type="button"
            onClick={() => setActiveTab('watched_log')}
            className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'watched_log'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#17223b]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📜 Log Últimas Vistas ({mediaReviews.length})</span>
          </button>

          <button
            id="tab-media-reviews"
            type="button"
            onClick={() => setActiveTab('media_reviews')}
            className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'media_reviews'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#17223b]'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>⭐ Galería Reseñas</span>
          </button>
        </div>

        {/* Global Search inside the view */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar títulos, géneros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
              isDark 
                ? 'bg-[#0b1326] border-slate-700/80 text-slate-200 placeholder-slate-500' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs'
            }`}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MEDIA BACKLOG BOARD (Películas y Series Pendientes) */}
      {/* ========================================================================= */}
      {activeTab === 'media_backlog' && (
        <div id="media-backlog-view" className="space-y-4">
          {/* Filter Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
            isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-mono flex items-center gap-1.5 mr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Filter className="w-3.5 h-3.5" /> Filtros:
              </span>

              {/* Type Filter */}
              <select
                value={selectedMediaType}
                onChange={(e) => setSelectedMediaType(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pink-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todos los formatos</option>
                <option value="pelicula">🎬 Películas</option>
                <option value="serie">📺 Series</option>
                <option value="anime">⚡ Anime</option>
                <option value="documental">🌍 Documentales</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedMediaStatus}
                onChange={(e) => setSelectedMediaStatus(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pink-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">⏳ Por Ver</option>
                <option value="viendo">▶️ Viendo Ahora</option>
                <option value="pausada">⏸️ En Pausa</option>
                <option value="completada">✅ Vistas / Finalizadas</option>
              </select>

              {/* Platform Filter */}
              <select
                value={selectedMediaPlatform}
                onChange={(e) => setSelectedMediaPlatform(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pink-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todas las plataformas</option>
                {streamingPlatforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddMedia}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ml-auto border ${
                isDark 
                  ? 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border-pink-500/40' 
                  : 'bg-pink-100 text-pink-900 hover:bg-pink-200 border-pink-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir a la lista</span>
            </button>
          </div>

          {/* Cards Grid */}
          {filteredMedia.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center mx-auto text-3xl">
                🍿
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay películas o series que coincidan</h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Prueba ajustando los filtros o agrega una nueva película o serie a tu tablero de ocio.
              </p>
              <button
                type="button"
                onClick={handleOpenAddMedia}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-400 transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Primera Película / Serie</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {filteredMedia.map((item) => {
                const isWatching = item.status === 'viendo';
                const isCompleted = item.status === 'completada';

                return (
                  <div
                    key={item.id}
                    className={`group relative rounded-2xl p-3 sm:p-5 border transition-all hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between ${
                      isDark
                        ? isWatching
                          ? 'border-purple-500/40 bg-gradient-to-b from-[#191932] to-[#131b2e]'
                          : isCompleted
                          ? 'bg-[#131b2e] border-emerald-500/30 opacity-80'
                          : 'bg-[#131b2e] border-slate-800'
                        : isWatching
                        ? 'border-purple-300 bg-purple-50/50 shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Card Header: Platform, Type & Status badge */}
                      <div className="flex items-center justify-between gap-1 mb-2 sm:mb-3">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold truncate border ${
                            isDark 
                              ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' 
                              : 'bg-pink-100 text-pink-900 border-pink-300'
                          }`}>
                            {item.platform}
                          </span>
                          <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.type}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex items-center space-x-1 ${
                          item.status === 'viendo'
                            ? isDark 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                              : 'bg-purple-100 text-purple-900 border border-purple-300 animate-pulse'
                            : item.status === 'pendiente'
                            ? isDark 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                            : item.status === 'completada'
                            ? isDark 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-700'
                        }`}>
                          <span className="truncate">
                            {item.status === 'viendo' && '▶️ Viendo'}
                            {item.status === 'pendiente' && '⏳ Por Ver'}
                            {item.status === 'completada' && '✅ Vista'}
                            {item.status === 'pausada' && '⏸️ Pausa'}
                          </span>
                        </span>
                      </div>

                      {/* Title & Emoji */}
                      <div className="flex items-start space-x-2 sm:space-x-3 mb-2">
                        <div className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl shrink-0 border ${
                          isDark ? 'bg-[#0b1326] border-slate-700/60' : 'bg-slate-100 border-slate-200'
                        }`}>
                          {item.coverEmoji || '🎬'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs sm:text-base font-bold transition-colors leading-snug truncate sm:whitespace-normal ${
                            isDark ? 'text-white group-hover:text-pink-300' : 'text-slate-900 group-hover:text-pink-700'
                          }`}>
                            {item.title}
                          </h4>
                          {item.genre && (
                            <p className={`text-[10px] sm:text-xs mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.genre} {item.releaseYear ? `(${item.releaseYear})` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Episode / Duration progress */}
                      {(item.totalDurationOrSeasons || item.currentSeasonOrEpisode) && (
                        <div className={`p-1.5 sm:p-2.5 rounded-xl border my-2 sm:my-3 flex items-center justify-between text-[10px] sm:text-xs font-mono ${
                          isDark ? 'bg-[#0b1326]/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {item.totalDurationOrSeasons && (
                            <span className={`flex items-center gap-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                              <span className="truncate">{item.totalDurationOrSeasons}</span>
                            </span>
                          )}
                          {item.currentSeasonOrEpisode && (
                            <span className={`font-bold flex items-center gap-1 truncate ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                              <span className="truncate">{item.currentSeasonOrEpisode}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes / Tags */}
                      {item.notes && (
                        <p className={`text-[11px] sm:text-xs italic line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-lg ${
                          isDark ? 'text-slate-300/90 bg-[#0b1326]/30' : 'text-slate-700 bg-slate-50'
                        }`}>
                          "{item.notes}"
                        </p>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-mono ${
                              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className={`pt-2 sm:pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 ${
                      isDark ? 'border-slate-800/80' : 'border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMedia(item)}
                          className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Editar"
                        >
                          <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar "${item.title}" de tu lista?`)) {
                              onDeleteMediaBacklog(item.id);
                            }
                          }}
                          className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                          }`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>

                      {/* Button to Mark as Watched & Rate with 5 Stars */}
                      <button
                        type="button"
                        onClick={() => handleMarkAsWatchedAndReview(item)}
                        className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950 shrink-0" />
                        <span className="truncate">{isCompleted ? 'Editar' : '¡Ya la vi! ⭐'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GAME BACKLOG TABLE (Tabla de Videojuegos Pendientes & En Progreso) */}
      {/* ========================================================================= */}
      {activeTab === 'game_backlog' && (
        <div id="game-backlog-view" className="space-y-4">
          {/* Filter & Controls Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
            isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-mono flex items-center gap-1.5 mr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Filter className="w-3.5 h-3.5" /> Filtros:
              </span>

              <select
                value={selectedGamePlatform}
                onChange={(e) => setSelectedGamePlatform(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todas las plataformas</option>
                {gamingPlatforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={selectedGameStatus}
                onChange={(e) => setSelectedGameStatus(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todos los estados</option>
                <option value="jugando">🎮 Jugando Actualmente</option>
                <option value="pendiente">⏳ Pendiente en Biblioteca</option>
                <option value="pausado">⏸️ En Pausa</option>
                <option value="completado">🏆 Completado / Platino</option>
                <option value="abandonado">❌ Abandonado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddGame}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ml-auto border ${
                isDark 
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-cyan-500/40' 
                  : 'bg-cyan-100 text-cyan-900 hover:bg-cyan-200 border-cyan-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Videojuego</span>
            </button>
          </div>

          {/* Interactive Gaming Table */}
          {filteredGames.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto text-3xl">
                🎮
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay videojuegos registrados</h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Registra los títulos que tienes pendientes en Steam, PlayStation, Nintendo Switch o Xbox para llevar el control de tus horas y logros.
              </p>
              <button
                type="button"
                onClick={handleOpenAddGame}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Primer Videojuego</span>
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                      isDark ? 'bg-[#0b1326] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <th className="py-3 px-3 sm:px-4 font-bold">Juego / Título</th>
                      <th className="py-3 px-3 sm:px-4 font-bold">Plataforma</th>
                      <th className="py-3 px-3 sm:px-4 font-bold hidden sm:table-cell">Género</th>
                      <th className="py-3 px-3 sm:px-4 font-bold">Estado</th>
                      <th className="py-3 px-3 sm:px-4 font-bold">Progreso / Horas</th>
                      <th className="py-3 px-3 sm:px-4 font-bold hidden md:table-cell">Calificación</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {filteredGames.map((game) => {
                      const played = game.playedHours || 0;
                      const estimated = game.estimatedHours || 0;
                      const progressPct = estimated > 0 ? Math.min(100, Math.round((played / estimated) * 100)) : 0;

                      return (
                        <tr key={game.id} className={`transition-colors group ${
                          isDark ? 'hover:bg-[#18233c]/60' : 'hover:bg-slate-50'
                        }`}>
                          {/* Title & Icon */}
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <span className={`text-lg sm:text-xl p-1 sm:p-1.5 rounded-lg border shrink-0 ${
                                isDark ? 'bg-[#0b1326] border-slate-700/60' : 'bg-slate-100 border-slate-200'
                              }`}>
                                {game.coverEmoji || '🎮'}
                              </span>
                              <div className="min-w-0">
                                <p className={`font-bold truncate max-w-[120px] sm:max-w-none transition-colors ${
                                  isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'
                                }`}>
                                  {game.title}
                                </p>
                                {game.notes && (
                                  <p className={`text-[10px] sm:text-[11px] line-clamp-1 italic ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                  }`}>{game.notes}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Platform */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold border ${
                              isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-100 text-cyan-900 border-cyan-200'
                            }`}>
                              {game.platform}
                            </span>
                          </td>

                          {/* Genre */}
                          <td className={`py-3 px-3 sm:px-4 whitespace-nowrap hidden sm:table-cell ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {game.genre}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold inline-flex items-center gap-1 ${
                              game.status === 'jugando'
                                ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse' : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                                : game.status === 'pendiente'
                                ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
                                : game.status === 'completado'
                                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-700'
                            }`}>
                              <span>
                                {game.status === 'jugando' && '🎮 Jugando'}
                                {game.status === 'pendiente' && '⏳ Pendiente'}
                                {game.status === 'completado' && '🏆 Completado'}
                                {game.status === 'pausado' && '⏸️ Pausa'}
                                {game.status === 'abandonado' && '❌ Abandonado'}
                              </span>
                            </span>
                          </td>

                          {/* Progress / Hours */}
                          <td className="py-3 px-3 sm:px-4">
                            <div className="w-24 sm:w-36 space-y-1">
                              <div className={`flex justify-between text-[10px] sm:text-[11px] font-mono ${
                                isDark ? 'text-slate-300' : 'text-slate-700'
                              }`}>
                                <span>{played}h</span>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{estimated > 0 ? `/ ${estimated}h` : ''} ({progressPct}%)</span>
                              </div>
                              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              {game.achievementsProgress && (
                                <p className={`text-[9px] sm:text-[10px] font-mono flex items-center gap-1 mt-0.5 ${
                                  isDark ? 'text-amber-300' : 'text-amber-800'
                                }`}>
                                  <Award className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate">{game.achievementsProgress}</span>
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Rating */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden md:table-cell">
                            {game.scoreOrRating ? (
                              <div className="flex items-center text-amber-500">
                                {renderStarRating(game.scoreOrRating)}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-mono">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1 sm:space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditGame(game)}
                                className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="Editar videojuego"
                              >
                                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar "${game.title}" de tu tabla de videojuegos?`)) {
                                    onDeleteGameBacklog(game.id);
                                  }
                                }}
                                className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                                }`}
                                title="Eliminar videojuego"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOP 10 RANKED MEDIA BY STARS (🏆 Podio y Clasificación de Películas/Series) */}
      {/* ========================================================================= */}
      {activeTab === 'top10_ranked' && (
        <div id="top10-ranked-view" className="space-y-6">
          {/* Top 10 Filter and Header Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border ${
            isDark ? 'bg-[#131b2e] border-amber-500/30' : 'bg-white border-amber-300 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-amber-800'
              }`}>
                <Trophy className="w-4 h-4 text-amber-500" /> Clasificación:
              </span>

              {/* Format Filter */}
              <select
                id="filter-top10-type"
                value={top10TypeFilter}
                onChange={(e) => setTop10TypeFilter(e.target.value as 'all' | 'pelicula' | 'serie')}
                className={`text-xs border rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">🎬 Todos los formatos (Películas & Series)</option>
                <option value="pelicula">🎬 Solo Películas</option>
                <option value="serie">📺 Solo Series / Miniseries</option>
              </select>

              {/* Min Rating Filter */}
              <select
                id="filter-top10-min-rating"
                value={top10MinRating}
                onChange={(e) => setTop10MinRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className={`text-xs border rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todas las calificaciones (1 a 5 ★)</option>
                <option value="5">⭐⭐⭐⭐⭐ Solo 5 Estrellas (Obras Maestras)</option>
                <option value="4">⭐⭐⭐⭐ 4+ Estrellas (Muy Buenas o más)</option>
                <option value="3">⭐⭐⭐ 3+ Estrellas</option>
              </select>
            </div>

            <button
              id="btn-add-review-top10"
              type="button"
              onClick={handleOpenAddReview}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer ml-auto"
            >
              <Star className="w-3.5 h-3.5 fill-slate-950" />
              <span>+ Calificar Nueva Película</span>
            </button>
          </div>

          {top10Media.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-amber-500/20' : 'bg-white border-amber-200 shadow-xs'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl">
                🏆
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay películas o series que coincidan con este filtro</h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Califica tus películas y series favoritas con estrellas de 1 a 5 para armar automáticamente tu Top 10 personalizado.
              </p>
              <button
                type="button"
                onClick={handleOpenAddReview}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>Calificar y Crear Top 10</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* TOP 3 PODIUM SECTION */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className={`text-sm sm:text-base font-extrabold uppercase font-mono tracking-wider ${
                    isDark ? 'text-amber-300' : 'text-amber-800'
                  }`}>
                    Podio de Honor (Top 3 Favoritas)
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                  {/* PODIUM #1 (GOLD) */}
                  {top10Media[0] && (
                    <div
                      key={top10Media[0].id}
                      className={`order-1 lg:order-2 rounded-3xl p-6 border-2 border-amber-400 shadow-2xl relative overflow-hidden flex flex-col justify-between ${
                        isDark 
                          ? 'bg-gradient-to-b from-[#241a10] via-[#1a1528] to-[#121829] shadow-amber-500/20' 
                          : 'bg-gradient-to-b from-amber-50 via-white to-amber-50/40 shadow-amber-200/50'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
                      
                      <div>
                        {/* Gold Badge */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                            <Crown className="w-4 h-4 fill-slate-950" /> #1 ORO SUPREMO
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                            {top10Media[0].platform || 'Cine'}
                          </span>
                        </div>

                        {/* Title and Emoji */}
                        <div className="flex items-start space-x-3.5 mb-4">
                          <span className={`text-4xl p-2.5 rounded-2xl border shrink-0 shadow-inner ${
                            isDark ? 'bg-[#0b1326] border-amber-400/40' : 'bg-white border-amber-300'
                          }`}>
                            {top10Media[0].coverEmoji || '👑'}
                          </span>
                          <div>
                            <h4 className={`text-xl font-black leading-snug ${isDark ? 'text-amber-100' : 'text-slate-900'}`}>
                              {top10Media[0].title}
                            </h4>
                            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
                              {top10Media[0].genre || (top10Media[0].type === 'serie' ? 'Serie de Televisión' : 'Película')}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className={`p-3 rounded-2xl border flex items-center justify-between mb-4 ${
                          isDark ? 'bg-[#0b1326] border-amber-500/40' : 'bg-white border-amber-300'
                        }`}>
                          <span className={`text-xs font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Puntaje Perfecto:</span>
                          <div className="scale-110 origin-right">
                            {renderStarRating(top10Media[0].rating)}
                          </div>
                        </div>

                        {/* Quote */}
                        {top10Media[0].favoriteMomentOrQuote && (
                          <div className={`border-l-2 border-amber-400 p-3 rounded-r-xl my-3 text-xs italic leading-relaxed flex items-start space-x-2 ${
                            isDark ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-100/70 text-amber-900'
                          }`}>
                            <Quote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>{top10Media[0].favoriteMomentOrQuote}</span>
                          </div>
                        )}

                        {/* Review snippet */}
                        {top10Media[0].review && (
                          <p className={`text-xs line-clamp-3 leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {top10Media[0].review}
                          </p>
                        )}
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
                        isDark ? 'border-amber-500/20 text-slate-400' : 'border-amber-200 text-slate-600'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          Vista: {top10Media[0].watchedDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(top10Media[0])}
                          className={`px-2.5 py-1 rounded-lg transition-colors font-sans font-bold flex items-center gap-1 cursor-pointer border ${
                            isDark ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border-amber-400/30' : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PODIUM #2 (SILVER) */}
                  {top10Media[1] && (
                    <div
                      key={top10Media[1].id}
                      className={`order-2 lg:order-1 rounded-3xl p-6 border shadow-xl relative overflow-hidden flex flex-col justify-between ${
                        isDark 
                          ? 'bg-gradient-to-b from-[#181e2e] via-[#131b2e] to-[#0f172a] border-slate-400/40' 
                          : 'bg-white border-slate-300 shadow-slate-200/50'
                      }`}
                    >
                      <div>
                        {/* Silver Badge */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 shadow-md flex items-center gap-1.5">
                            <Medal className="w-4 h-4 fill-slate-950" /> #2 PLATA
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {top10Media[1].platform || 'Streaming'}
                          </span>
                        </div>

                        {/* Title and Emoji */}
                        <div className="flex items-start space-x-3 mb-4">
                          <span className={`text-3xl p-2 rounded-2xl border shrink-0 ${
                            isDark ? 'bg-[#0b1326] border-slate-700' : 'bg-slate-100 border-slate-200'
                          }`}>
                            {top10Media[1].coverEmoji || '🥈'}
                          </span>
                          <div>
                            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {top10Media[1].title}
                            </h4>
                            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {top10Media[1].genre || top10Media[1].type}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className={`p-2.5 rounded-2xl border flex items-center justify-between mb-4 ${
                          isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Puntaje:</span>
                          {renderStarRating(top10Media[1].rating)}
                        </div>

                        {/* Quote */}
                        {top10Media[1].favoriteMomentOrQuote && (
                          <div className={`border-l-2 border-slate-400 p-2.5 rounded-r-xl my-3 text-xs italic flex items-start space-x-2 ${
                            isDark ? 'bg-slate-800/60 text-slate-200' : 'bg-slate-100 text-slate-800'
                          }`}>
                            <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{top10Media[1].favoriteMomentOrQuote}</span>
                          </div>
                        )}

                        {/* Review snippet */}
                        {top10Media[1].review && (
                          <p className={`text-xs line-clamp-3 leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {top10Media[1].review}
                          </p>
                        )}
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
                        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}>
                        <span>Vista: {top10Media[1].watchedDate}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(top10Media[1])}
                          className={`p-1 rounded-lg cursor-pointer ${
                            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PODIUM #3 (BRONZE) */}
                  {top10Media[2] && (
                    <div
                      key={top10Media[2].id}
                      className={`order-3 rounded-3xl p-6 border shadow-xl relative overflow-hidden flex flex-col justify-between ${
                        isDark 
                          ? 'bg-gradient-to-b from-[#21171a] via-[#161726] to-[#0f172a] border-amber-700/40' 
                          : 'bg-white border-amber-300/60 shadow-amber-100/50'
                      }`}
                    >
                      <div>
                        {/* Bronze Badge */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-amber-700 to-orange-700 text-amber-100 shadow-md flex items-center gap-1.5">
                            <Award className="w-4 h-4" /> #3 BRONCE
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {top10Media[2].platform || 'Streaming'}
                          </span>
                        </div>

                        {/* Title and Emoji */}
                        <div className="flex items-start space-x-3 mb-4">
                          <span className={`text-3xl p-2 rounded-2xl border shrink-0 ${
                            isDark ? 'bg-[#0b1326] border-amber-900/60' : 'bg-amber-50 border-amber-200'
                          }`}>
                            {top10Media[2].coverEmoji || '🥉'}
                          </span>
                          <div>
                            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {top10Media[2].title}
                            </h4>
                            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-amber-200/60' : 'text-amber-800'}`}>
                              {top10Media[2].genre || top10Media[2].type}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className={`p-2.5 rounded-2xl border flex items-center justify-between mb-4 ${
                          isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Puntaje:</span>
                          {renderStarRating(top10Media[2].rating)}
                        </div>

                        {/* Quote */}
                        {top10Media[2].favoriteMomentOrQuote && (
                          <div className={`border-l-2 border-amber-700 p-2.5 rounded-r-xl my-3 text-xs italic flex items-start space-x-2 ${
                            isDark ? 'bg-amber-950/40 text-amber-200/90' : 'bg-amber-50 text-amber-900'
                          }`}>
                            <Quote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{top10Media[2].favoriteMomentOrQuote}</span>
                          </div>
                        )}

                        {/* Review snippet */}
                        {top10Media[2].review && (
                          <p className={`text-xs line-clamp-3 leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {top10Media[2].review}
                          </p>
                        )}
                      </div>

                      <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
                        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}>
                        <span>Vista: {top10Media[2].watchedDate}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(top10Media[2])}
                          className={`p-1 rounded-lg cursor-pointer ${
                            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* REST OF TOP 10 (Positions #4 to #10) */}
              {top10Media.length > 3 && (
                <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-extrabold uppercase font-mono tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <ListOrdered className="w-4 h-4 text-amber-500" />
                      Clasificación General (Posiciones 4 al {top10Media.length})
                    </h3>
                    <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {top10Media.length} obras en el ranking
                    </span>
                  </div>

                  <div className={`rounded-2xl border overflow-hidden shadow-xs ${
                    isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
                      {top10Media.slice(3).map((item, idx) => {
                        const rankNumber = idx + 4;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 group ${
                              isDark ? 'hover:bg-[#18223a]' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              {/* Position Badge */}
                              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0 transition-colors ${
                                isDark 
                                  ? 'bg-[#0b1326] border-slate-700 text-slate-300 group-hover:border-amber-400 group-hover:text-amber-300' 
                                  : 'bg-slate-100 border-slate-300 text-slate-700 group-hover:border-amber-500 group-hover:text-amber-700'
                              }`}>
                                #{rankNumber}
                              </div>

                              {/* Emoji */}
                              <span className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                                isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-100 border-slate-200'
                              }`}>
                                {item.coverEmoji || '🎬'}
                              </span>

                              {/* Title, Platform & Quote */}
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <h4 className={`font-extrabold text-xs sm:text-base transition-colors ${
                                    isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-700'
                                  }`}>
                                    {item.title}
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {item.type}
                                  </span>
                                  {item.platform && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                      isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-100 text-cyan-900 border-cyan-200'
                                    }`}>
                                      {item.platform}
                                    </span>
                                  )}
                                </div>

                                <div className={`flex flex-wrap items-center gap-2 text-xs ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                  {item.genre && <span>{item.genre}</span>}
                                  {item.genre && <span>•</span>}
                                  <span className="font-mono text-[11px]">Vista el {item.watchedDate}</span>
                                </div>

                                {item.favoriteMomentOrQuote && (
                                  <p className={`text-xs italic line-clamp-1 ${
                                    isDark ? 'text-amber-300/80' : 'text-amber-800'
                                  }`}>
                                    "{item.favoriteMomentOrQuote}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Stars and Actions */}
                            <div className={`flex items-center justify-between md:justify-end space-x-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 ${
                              isDark ? 'border-slate-800' : 'border-slate-200'
                            }`}>
                              <div className={`px-3 py-1.5 rounded-xl border ${
                                isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                              }`}>
                                {renderStarRating(item.rating)}
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReview(item)}
                                  className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                  title="Editar reseña"
                                >
                                  <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar "${item.title}" del ranking?`)) {
                                      onDeleteMediaReview(item.id);
                                    }
                                  }}
                                  className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                                    isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                                  }`}
                                  title="Eliminar de la lista"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CHRONOLOGICAL WATCHED LOG (📜 Historial & Línea de Tiempo de Obras Vistas) */}
      {/* ========================================================================= */}
      {activeTab === 'watched_log' && (
        <div id="watched-log-view" className="space-y-6">
          {/* Header Bar and Metrics */}
          <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'bg-[#131b2e] border-emerald-500/30' : 'bg-white border-emerald-300 shadow-xs'
          }`}>
            <div className="space-y-1">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                <History className="w-3.5 h-3.5" />
                <span>DIARIO CINEMATOGRÁFICO</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Log de Películas & Series Vistas</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Registro cronológico organizado por mes de todo tu contenido audiovisual consumido
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-[9px] sm:text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Vistas</p>
                <p className="text-base sm:text-lg font-black text-emerald-500">{chronologicalWatchedLog.length}</p>
              </div>
              <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-[9px] sm:text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Promedio</p>
                <p className="text-base sm:text-lg font-black text-amber-500">{averageRating} ★</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddReview}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Obra</span>
                <span className="sm:hidden">Registrar</span>
              </button>
            </div>
          </div>

          {/* Star Distribution Summary Bar */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border ${
            isDark ? 'bg-[#101729] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <p className={`text-xs font-mono uppercase mb-2.5 flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Desglose de Calificaciones:
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starCounts[stars as keyof typeof starCounts] || 0;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setSelectedReviewRating(selectedReviewRating === stars ? 'all' : stars)}
                    className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                      selectedReviewRating === stars
                        ? isDark ? 'bg-amber-400/20 border-amber-400 text-amber-300' : 'bg-amber-100 border-amber-400 text-amber-900'
                        : isDark ? 'bg-[#0b1326] border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs font-mono font-bold text-amber-500">{stars} ★</div>
                    <div className={`text-xs sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chronological Month-by-Month Timeline */}
          {Object.keys(groupedChronologicalLog).length === 0 ? (
            <div className={`rounded-3xl p-10 text-center border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl">
                📜
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No se encontraron registros en el log</h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                No hay películas o series vistas que coincidan con la búsqueda o filtro seleccionado.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.entries(groupedChronologicalLog) as [string, MediaReviewItem[]][]).map(([monthYear, items]) => (
                <div key={monthYear} className="space-y-3">
                  {/* Month Year Header */}
                  <div className="flex items-center space-x-2 sm:space-x-3 pt-2">
                    <div className={`p-1.5 sm:p-2 rounded-xl border ${
                      isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    }`}>
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className={`text-sm sm:text-base font-extrabold font-mono tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {monthYear}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono ${
                      isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {items.length} {items.length === 1 ? 'obra vista' : 'obras'}
                    </span>
                    <div className={`flex-1 h-px ml-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                  </div>

                  {/* Month Items Cards (2 cols on mobile) */}
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-4">
                    {items.map((review) => (
                      <div
                        key={review.id}
                        className={`rounded-2xl p-3 sm:p-5 border shadow-sm relative overflow-hidden flex flex-col justify-between group transition-all ${
                          isDark 
                            ? 'bg-[#131b2e] border-slate-800/90 hover:border-emerald-500/40' 
                            : 'bg-white border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div>
                          {/* Header: Date, Platform & Recommend */}
                          <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3">
                            <span className="text-[10px] sm:text-xs font-mono text-emerald-500 font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span className="truncate">{review.watchedDate}</span>
                            </span>

                            <div className="flex items-center space-x-1">
                              {review.platform && (
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border truncate max-w-[70px] sm:max-w-none ${
                                  isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-100 text-cyan-900 border-cyan-200'
                                }`}>
                                  {review.platform}
                                </span>
                              )}
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono uppercase ${
                                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {review.type}
                              </span>
                            </div>
                          </div>

                          {/* Title & Emoji */}
                          <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                            <span className={`text-xl sm:text-3xl p-1 sm:p-2 rounded-xl border shrink-0 ${
                              isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-100 border-slate-200'
                            }`}>
                              {review.coverEmoji || '🍿'}
                            </span>
                            <div className="min-w-0">
                              <h5 className={`font-extrabold text-xs sm:text-base transition-colors truncate sm:line-clamp-2 ${
                                isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-700'
                              }`}>
                                {review.title}
                              </h5>
                              {review.genre && (
                                <p className={`text-[10px] sm:text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{review.genre}</p>
                              )}
                            </div>
                          </div>

                          {/* Star Rating Render */}
                          <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between mb-2 sm:mb-3 ${
                            isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <span className={`text-[10px] sm:text-xs font-mono hidden sm:inline ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>Calificación:</span>
                            {renderStarRating(review.rating)}
                          </div>

                          {/* Personal Review */}
                          {review.review && (
                            <p className={`text-[10px] sm:text-xs leading-relaxed p-2 sm:p-3 rounded-xl border mb-2 sm:mb-3 whitespace-pre-line line-clamp-2 sm:line-clamp-none ${
                              isDark ? 'bg-[#0b1326]/60 border-slate-800/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {review.review}
                            </p>
                          )}

                          {/* Quote */}
                          {review.favoriteMomentOrQuote && (
                            <div className={`border-l-2 border-emerald-500 p-2 sm:p-2.5 rounded-r-xl my-2 text-[10px] sm:text-xs italic flex items-start space-x-1.5 ${
                              isDark ? 'bg-emerald-500/5 text-emerald-200/90' : 'bg-emerald-50 text-emerald-900'
                            }`}>
                              <Quote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{review.favoriteMomentOrQuote}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className={`pt-2 sm:pt-3 mt-1 sm:mt-2 border-t flex items-center justify-between text-xs ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          {review.wouldRecommend ? (
                            <span className="text-emerald-500 text-[10px] sm:text-[11px] font-mono flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> <span className="hidden sm:inline">Recomendada</span>
                            </span>
                          ) : (
                            <span className="text-rose-500 text-[10px] sm:text-[11px] font-mono flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" /> <span className="hidden sm:inline">No recomendada</span>
                            </span>
                          )}

                          <div className="flex items-center space-x-1 sm:space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditReview(review)}
                              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs ${
                                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <Edit3 className="w-3 h-3" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar del registro "${review.title}"?`)) {
                                  onDeleteMediaReview(review.id);
                                }
                              }}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                              }`}
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MEDIA REVIEWS & WATCHED TRACKER (Vistas, Calificación 5 Estrellas & Reseñas) */}
      {/* ========================================================================= */}
      {activeTab === 'media_reviews' && (
        <div id="media-reviews-view" className="space-y-4">
          {/* Filter Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
            isDark ? 'bg-[#131b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-mono flex items-center gap-1.5 mr-1 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Filter className="w-3.5 h-3.5" /> Filtros:
              </span>

              {/* Star Rating Filter */}
              <select
                value={selectedReviewRating}
                onChange={(e) => setSelectedReviewRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todas las estrellas (1 a 5 ★)</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Estrellas - Obra Maestra)</option>
                <option value="4">⭐⭐⭐⭐ (4 Estrellas - Muy Buena)</option>
                <option value="3">⭐⭐⭐ (3 Estrellas - Buena / Pasable)</option>
                <option value="2">⭐⭐ (2 Estrellas - Regular)</option>
                <option value="1">⭐ (1 Estrella - Decepcionante)</option>
              </select>

              {/* Format Filter */}
              <select
                value={selectedMediaType}
                onChange={(e) => setSelectedMediaType(e.target.value)}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-[#0b1326] text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Todos los formatos</option>
                <option value="pelicula">🎬 Películas</option>
                <option value="serie">📺 Series</option>
                <option value="anime">⚡ Anime</option>
                <option value="documental">🌍 Documentales</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddReview}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ml-auto border ${
                isDark 
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border-amber-400/40' 
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>Escribir Nueva Reseña</span>
            </button>
          </div>

          {/* Reviews Grid (2 cols on mobile) */}
          {filteredReviews.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto text-3xl">
                ⭐
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aún no has calificado películas o series</h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Lleva un diario de todo lo que has visto, asígnale estrellas de 1 a 5 y escribe una reseña con tus impresiones o citas favoritas.
              </p>
              <button
                type="button"
                onClick={handleOpenAddReview}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-orange-400 transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>Calificar Mi Primera Película o Serie</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-5">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className={`rounded-2xl p-3 sm:p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between group transition-all ${
                    isDark 
                      ? 'bg-[#131b2e] border-amber-500/20 hover:border-amber-500/50' 
                      : 'bg-white border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    {/* Header: Platform, Type, Date & Recommendation */}
                    <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border ${
                          isDark ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}>
                          {review.platform || 'Streaming'}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono uppercase ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {review.type}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {review.wouldRecommend ? (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Recomendada</span>
                          </span>
                        ) : (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <ThumbsDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">No recomendada</span>
                          </span>
                        )}
                        <span className={`text-[10px] sm:text-[11px] font-mono flex items-center gap-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span className="truncate">{review.watchedDate}</span>
                        </span>
                      </div>
                    </div>

                    {/* Title and Rating */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <span className={`text-xl sm:text-3xl p-1 sm:p-2 rounded-xl border shrink-0 ${
                          isDark ? 'bg-[#0b1326] border-slate-700/60' : 'bg-slate-100 border-slate-200'
                        }`}>
                          {review.coverEmoji || '🍿'}
                        </span>
                        <div className="min-w-0">
                          <h4 className={`text-xs sm:text-lg font-extrabold truncate sm:line-clamp-2 transition-colors ${
                            isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-700'
                          }`}>
                            {review.title}
                          </h4>
                          {review.genre && (
                            <p className={`text-[10px] sm:text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{review.genre}</p>
                          )}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border shrink-0 ${
                        isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        {renderStarRating(review.rating)}
                      </div>
                    </div>

                    {/* Personal Review Box */}
                    {review.review && (
                      <div className={`p-2 sm:p-4 rounded-xl border my-2 sm:my-3 text-[10px] sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none ${
                        isDark ? 'bg-[#0b1326]/80 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                        <p className="whitespace-pre-line">{review.review}</p>
                      </div>
                    )}

                    {/* Memorable Quote / Highlight */}
                    {review.favoriteMomentOrQuote && (
                      <div className={`border-l-2 border-amber-500 p-2 sm:p-3 rounded-r-xl my-2 flex items-start space-x-1.5 sm:space-x-2 ${
                        isDark ? 'bg-amber-500/5 text-amber-200/90' : 'bg-amber-50 text-amber-900'
                      }`}>
                        <Quote className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] sm:text-xs italic font-sans line-clamp-2">
                          {review.favoriteMomentOrQuote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className={`pt-2 sm:pt-3 mt-2 sm:mt-3 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <span className={`font-mono text-[10px] sm:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Puntaje: <strong className="text-amber-500">{review.rating} / 5.0</strong>
                    </span>

                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditReview(review)}
                        className={`px-1.5 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la reseña de "${review.title}"?`)) {
                            onDeleteMediaReview(review.id);
                          }
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                        }`}
                        title="Eliminar reseña"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MEDIA BACKLOG */}
      {/* ========================================================================= */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`border rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative ${
            isDark ? 'bg-[#131b2e] border-pink-500/30 text-white' : 'bg-white border-pink-300 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/30 text-2xl">
                🎬
              </div>
              <div>
                <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingMedia ? 'Editar Película / Serie' : 'Añadir Película o Serie'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Backlog de ocio y streaming</p>
              </div>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Título de la Obra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dune: Parte Dos, Severance, Arcane..."
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-pink-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Formato
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="pelicula">🎬 Película</option>
                    <option value="serie">📺 Serie</option>
                    <option value="anime">⚡ Anime</option>
                    <option value="documental">🌍 Documental</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Plataforma
                  </label>
                  <select
                    value={mediaPlatform}
                    onChange={(e) => setMediaPlatform(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {streamingPlatforms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Género
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Sci-Fi, Drama, Thriller"
                    value={mediaGenre}
                    onChange={(e) => setMediaGenre(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Estado Actual
                  </label>
                  <select
                    value={mediaStatus}
                    onChange={(e) => setMediaStatus(e.target.value as MediaStatus)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="pendiente">⏳ Por Ver</option>
                    <option value="viendo">▶️ Viendo Actualmente</option>
                    <option value="pausada">⏸️ En Pausa</option>
                    <option value="completada">✅ Vista / Finalizada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Duración
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 140 min"
                    value={mediaDuration}
                    onChange={(e) => setMediaDuration(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Episodio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: T2-E3"
                    value={mediaCurrentSeason}
                    onChange={(e) => setMediaCurrentSeason(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={mediaEmoji}
                    onChange={(e) => setMediaEmoji(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs text-center focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Notas / Recomendaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Ver en audio original con subtítulos, recomendada por amigos..."
                  value={mediaNotes}
                  onChange={(e) => setMediaNotes(e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Nolan, Obra Maestra, Premios Emmy"
                  value={mediaTagsInput}
                  onChange={(e) => setMediaTagsInput(e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end space-x-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/25 transition-all cursor-pointer"
                >
                  {editingMedia ? 'Guardar Cambios' : 'Añadir al Backlog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT GAME BACKLOG */}
      {/* ========================================================================= */}
      {isGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`border rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative ${
            isDark ? 'bg-[#131b2e] border-cyan-500/30 text-white' : 'bg-white border-cyan-300 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setIsGameModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 text-2xl">
                🎮
              </div>
              <div>
                <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingGame ? 'Editar Videojuego' : 'Añadir Videojuego a la Tabla'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Control de horas, plataforma y logros</p>
              </div>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Título del Videojuego *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Elden Ring, Baldur's Gate 3, Zelda..."
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Plataforma
                  </label>
                  <select
                    value={gamePlatform}
                    onChange={(e) => setGamePlatform(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {gamingPlatforms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Género
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Soulslike, RPG, Aventura"
                    value={gameGenre}
                    onChange={(e) => setGameGenre(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Estado Actual
                  </label>
                  <select
                    value={gameStatus}
                    onChange={(e) => setGameStatus(e.target.value as GameStatus)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="jugando">🎮 Jugando Actualmente</option>
                    <option value="pendiente">⏳ Pendiente en Biblioteca</option>
                    <option value="pausado">⏸️ En Pausa</option>
                    <option value="completado">🏆 Completado</option>
                    <option value="abandonado">❌ Abandonado</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Emoji / Ícono
                  </label>
                  <input
                    type="text"
                    value={gameEmoji}
                    onChange={(e) => setGameEmoji(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-center focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Horas Estimadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 40"
                    value={gameEstimatedHours}
                    onChange={(e) => setGameEstimatedHours(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Horas Jugadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 15"
                    value={gamePlayedHours}
                    onChange={(e) => setGamePlayedHours(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Progreso de Logros / Trofeos
                </label>
                <input
                  type="text"
                  placeholder="Ej: 24 de 40 trofeos descubiertos / Modo Difícil"
                  value={gameAchievements}
                  onChange={(e) => setGameAchievements(e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Calificación Personal (1 a 5 Estrellas - Opcional)
                </label>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#0b1326] border-slate-700' : 'bg-slate-50 border-slate-300'
                }`}>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Puntaje:</span>
                  {renderStarRating(gameScore || 0, true, (r) => setGameScore(r))}
                  {gameScore && (
                    <button
                      type="button"
                      onClick={() => setGameScore(undefined)}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Notas de Avance / Build
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Build de magia pura, explorar mazmorras subterráneas..."
                  value={gameNotes}
                  onChange={(e) => setGameNotes(e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end space-x-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsGameModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  {editingGame ? 'Guardar Videojuego' : 'Registrar en Tabla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MEDIA REVIEW (Calificación 5 Estrellas & Reseña) */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`border rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative ${
            isDark ? 'bg-[#131b2e] border-amber-500/30 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className={`absolute top-5 right-5 p-1 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 text-2xl">
                ⭐
              </div>
              <div>
                <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingReview ? 'Editar Reseña & Calificación' : 'Calificar Película o Serie Vista'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Asigna estrellas de 1 a 5 y redacta tu reseña</p>
              </div>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Título de la Película / Serie *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Interstellar, Breaking Bad, Spider-Man..."
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Interactive Star Picker */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                isDark ? 'bg-[#0b1326] border-amber-500/30' : 'bg-amber-50/50 border-amber-300'
              }`}>
                <label className={`block text-xs font-mono uppercase font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  Tu Calificación: {reviewRating} de 5 Estrellas
                </label>
                <div className="flex justify-center py-1">
                  {renderStarRating(reviewRating, true, (r) => setReviewRating(r))}
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {reviewRating === 5 && '🌟 ¡Obra Maestra Imperdible!'}
                  {reviewRating === 4 && '✨ ¡Muy Buena Producción!'}
                  {reviewRating === 3 && '👍 Buena / Entretenida'}
                  {reviewRating === 2 && '😐 Regular / Pasable'}
                  {reviewRating === 1 && '👎 Decepcionante'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Formato
                  </label>
                  <select
                    value={reviewType}
                    onChange={(e) => setReviewType(e.target.value as MediaType)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="pelicula">🎬 Película</option>
                    <option value="serie">📺 Serie</option>
                    <option value="anime">⚡ Anime</option>
                    <option value="documental">🌍 Documental</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fecha en que se vio
                  </label>
                  <input
                    type="date"
                    required
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Plataforma / Cine
                  </label>
                  <select
                    value={reviewPlatform}
                    onChange={(e) => setReviewPlatform(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {streamingPlatforms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Emoji Representativo
                  </label>
                  <input
                    type="text"
                    value={reviewEmoji}
                    onChange={(e) => setReviewEmoji(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-xs text-center focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tu Reseña Personal / Crítica
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe qué te pareció, la banda sonora, actuaciones, giro de trama o reflexiones que te dejó..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500 leading-relaxed ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Frase o Momento Memorable (Opcional)
                </label>
                <input
                  type="text"
                  placeholder='Ej: "I am the danger" o La escena de persecución en el tren...'
                  value={reviewQuote}
                  onChange={(e) => setReviewQuote(e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-amber-500 italic ${
                    isDark ? 'bg-[#0b1326] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                isDark ? 'bg-[#0b1326] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>¿Recomiendas verla a otros?</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setReviewRecommend(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      reviewRecommend
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👍 Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewRecommend(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !reviewRecommend
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👎 No
                  </button>
                </div>
              </div>

              <div className={`flex justify-end space-x-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  {editingReview ? 'Guardar Reseña' : 'Publicar Calificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

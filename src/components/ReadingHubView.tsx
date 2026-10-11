import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  BookItem, 
  ReadingQuote, 
  BookStatus, 
  BookFormat, 
  BookCategory,
  ReadingSessionNote
} from '../types';
import {
  BookOpen,
  Bookmark,
  Sparkles,
  Search,
  Plus,
  Star,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Quote,
  Flame,
  Award,
  TrendingUp,
  RotateCcw,
  Check,
  ChevronRight,
  Filter,
  Layers,
  Heart,
  Calendar,
  X,
  Compass,
  Trophy,
  SlidersHorizontal,
  FileText,
  Smartphone,
  Headphones,
  BookMarked,
  Share2,
  Lightbulb,
  Zap
} from 'lucide-react';

interface ReadingHubViewProps {
  books: BookItem[];
  readingQuotes?: ReadingQuote[];
  onAddBook: (book: Omit<BookItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBook: (book: BookItem) => void;
  onDeleteBook: (bookId: string) => void;
  onQuickUpdateProgress?: (bookId: string, newCurrentPage: number, sessionNote?: string) => void;
  onAddQuote?: (quote: Omit<ReadingQuote, 'id' | 'createdAt'>) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onResetBooksData?: () => void;
}

const BOOK_CATEGORIES: { id: BookCategory; label: string; icon: string; defaultColor: string }[] = [
  { id: 'desarrollo_personal', label: 'Desarrollo Personal & Hábitos', icon: '⚡', defaultColor: 'from-amber-500 via-orange-600 to-amber-950' },
  { id: 'finanzas_negocios', label: 'Finanzas, Inversión & Negocios', icon: '💰', defaultColor: 'from-emerald-500 via-teal-700 to-slate-950' },
  { id: 'filosofia_mente', label: 'Filosofía, Estoicismo & Mente', icon: '🏛️', defaultColor: 'from-blue-600 via-indigo-800 to-slate-950' },
  { id: 'psicologia_conducta', label: 'Psicología & Toma de Decisiones', icon: '🧠', defaultColor: 'from-cyan-600 via-blue-700 to-indigo-950' },
  { id: 'ciencia_tecnologia', label: 'Ciencia, Tecnología & Software', icon: '💻', defaultColor: 'from-violet-600 via-indigo-800 to-slate-950' },
  { id: 'productividad_habitos', label: 'Productividad & Alto Rendimiento', icon: '🚀', defaultColor: 'from-amber-600 via-yellow-600 to-amber-950' },
  { id: 'liderazgo_gestion', label: 'Liderazgo & Gestión de Equipos', icon: '👑', defaultColor: 'from-rose-600 via-red-700 to-slate-950' },
  { id: 'historia_biografias', label: 'Historia, Biografías & Mundo', icon: '📜', defaultColor: 'from-amber-700 via-stone-800 to-neutral-950' },
  { id: 'ficcion_novela', label: 'Ficción, Novela & Literatura', icon: '✨', defaultColor: 'from-rose-500 via-pink-700 to-purple-950' },
  { id: 'salud_bienestar', label: 'Salud, Nutrición & Cuerpo', icon: '🌿', defaultColor: 'from-teal-500 via-emerald-700 to-slate-950' },
  { id: 'otro', label: 'Otra Temática', icon: '📚', defaultColor: 'from-slate-600 via-slate-700 to-slate-950' },
];

const COVER_GRADIENT_PRESETS = [
  { label: 'Ámbar & Fuego', gradient: 'from-amber-500 via-orange-600 to-amber-950' },
  { label: 'Esmeralda & Riqueza', gradient: 'from-emerald-500 via-teal-700 to-slate-950' },
  { label: 'Zafiro & Sabiduría', gradient: 'from-blue-600 via-indigo-800 to-slate-950' },
  { label: 'Cian & Intelecto', gradient: 'from-cyan-600 via-blue-700 to-indigo-950' },
  { label: 'Púrpura Real & Misterio', gradient: 'from-violet-600 via-purple-700 to-indigo-950' },
  { label: 'Rosa Rubí & Pasión', gradient: 'from-rose-500 via-pink-700 to-purple-950' },
  { label: 'Piedra & Estoicismo', gradient: 'from-amber-700 via-stone-800 to-neutral-950' },
  { label: 'Obsidiana & Elegancia', gradient: 'from-slate-700 via-slate-800 to-slate-950' },
];

const QUICK_BOOK_SUGGESTIONS = [
  {
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    category: 'productividad_habitos',
    totalPages: 336,
    format: 'fisico' as BookFormat,
    coverGradient: 'from-amber-500 via-orange-600 to-amber-950',
    coverEmoji: '⚡',
    keyTakeaway: 'No te elevas al nivel de tus metas; desciendes al nivel de tus sistemas.',
    tags: ['Hábitos', 'Productividad', 'Crecimiento']
  },
  {
    title: 'La Psicología del Dinero',
    author: 'Morgan Housel',
    category: 'finanzas_negocios',
    totalPages: 296,
    format: 'kindle_ebook' as BookFormat,
    coverGradient: 'from-emerald-500 via-teal-700 to-slate-950',
    coverEmoji: '💰',
    keyTakeaway: 'El éxito financiero trata más sobre tu comportamiento que sobre tu inteligencia matemática.',
    tags: ['Finanzas', 'Mentalidad', 'Libertad']
  },
  {
    title: 'El Hombre en Busca de Sentido',
    author: 'Viktor E. Frankl',
    category: 'filosofia_mente',
    totalPages: 160,
    format: 'fisico' as BookFormat,
    coverGradient: 'from-blue-600 via-indigo-800 to-slate-950',
    coverEmoji: '🕊️',
    keyTakeaway: 'A quien tiene un porqué para vivir, puede soportar casi cualquier cómo.',
    tags: ['Propósito', 'Filosofía', 'Estoicismo']
  },
  {
    title: 'Pensar Rápido, Pensar Despacio',
    author: 'Daniel Kahneman',
    category: 'psicologia_conducta',
    totalPages: 672,
    format: 'fisico' as BookFormat,
    coverGradient: 'from-cyan-600 via-blue-700 to-indigo-950',
    coverEmoji: '🧠',
    keyTakeaway: 'El Sistema 1 intuitivo guía nuestras vidas, pero el Sistema 2 debe auditar las decisiones críticas.',
    tags: ['Psicología', 'Sesgos', 'Toma de Decisiones']
  },
  {
    title: 'Meditaciones',
    author: 'Marco Aurelio',
    category: 'filosofia_mente',
    totalPages: 240,
    format: 'fisico' as BookFormat,
    coverGradient: 'from-amber-700 via-stone-800 to-neutral-950',
    coverEmoji: '🏛️',
    keyTakeaway: 'Tienes poder sobre tu mente, no sobre los acontecimientos externos. Encuentra tu fuerza interior.',
    tags: ['Estoicismo', 'Calma', 'Liderazgo']
  },
  {
    title: 'De Animales a Dioses (Sapiens)',
    author: 'Yuval Noah Harari',
    category: 'historia_biografias',
    totalPages: 496,
    format: 'fisico' as BookFormat,
    coverGradient: 'from-amber-600 via-yellow-700 to-stone-900',
    coverEmoji: '🌍',
    keyTakeaway: 'Lo que une a los humanos a gran escala es nuestra capacidad única de creer en ficciones compartidas.',
    tags: ['Historia', 'Humanidad', 'Antropología']
  },
  {
    title: 'Código Limpio (Clean Code)',
    author: 'Robert C. Martin',
    category: 'ciencia_tecnologia',
    totalPages: 464,
    format: 'kindle_ebook' as BookFormat,
    coverGradient: 'from-violet-600 via-indigo-800 to-slate-950',
    coverEmoji: '💻',
    keyTakeaway: 'La legibilidad y el cuidado de los detalles distinguen al artesano del software.',
    tags: ['Software', 'Programación', 'Buenas Prácticas']
  },
  {
    title: 'El Club de las 5 de la Mañana',
    author: 'Robin Sharma',
    category: 'desarrollo_personal',
    totalPages: 336,
    format: 'fisico' as BookFormat,
    coverGradient: 'from-orange-500 via-amber-600 to-slate-900',
    coverEmoji: '🌅',
    keyTakeaway: 'La fórmula 20/20/20: ejercicio intenso, reflexión/oración y crecimiento personal para dominar tu día.',
    tags: ['Rutina', 'Mañana', 'Disciplina']
  }
];

export const ReadingHubView: React.FC<ReadingHubViewProps> = ({
  books,
  readingQuotes = [],
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onQuickUpdateProgress,
  onAddQuote,
  onDeleteQuote,
  onResetBooksData,
}) => {
  const { isDark } = useTheme();

  // Navigation and Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'leyendo' | 'por_leer' | 'leido' | 'deseado' | 'citas'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'shelf' | 'compact'>('shelf');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  // Annual Reading Goal (e.g. 12 books per year)
  const [annualReadingGoal, setAnnualReadingGoal] = useState<number>(12);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState<boolean>(false);
  const [progressBook, setProgressBook] = useState<BookItem | null>(null);
  const [newCurrentPageInput, setNewCurrentPageInput] = useState<number>(0);
  const [sessionNoteInput, setSessionNoteInput] = useState<string>('');
  const [selectedBookDetail, setSelectedBookDetail] = useState<BookItem | null>(null);

  // Quote Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [newQuoteText, setNewQuoteText] = useState<string>('');
  const [newQuoteBook, setNewQuoteBook] = useState<string>('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState<string>('');
  const [newQuotePage, setNewQuotePage] = useState<string>('');
  const [newQuoteReflection, setNewQuoteReflection] = useState<string>('');

  // Book Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('');
  const [formCategory, setFormCategory] = useState<BookCategory>('desarrollo_personal');
  const [formStatus, setFormStatus] = useState<BookStatus>('por_leer');
  const [formFormat, setFormFormat] = useState<BookFormat>('fisico');
  const [formTotalPages, setFormTotalPages] = useState<number>(300);
  const [formCurrentPage, setFormCurrentPage] = useState<number>(0);
  const [formRating, setFormRating] = useState<number>(5);
  const [formCoverGradient, setFormCoverGradient] = useState<string>('from-amber-500 via-orange-600 to-amber-950');
  const [formCoverEmoji, setFormCoverEmoji] = useState<string>('📖');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formFinishDate, setFormFinishDate] = useState<string>('');
  const [formKeyTakeaway, setFormKeyTakeaway] = useState<string>('');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formFavoriteQuote, setFormFavoriteQuote] = useState<string>('');
  const [formRecommendedBy, setFormRecommendedBy] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter(b => b.status === 'leyendo');
    const completed = books.filter(b => b.status === 'leido');
    const toRead = books.filter(b => b.status === 'por_leer');
    const wishlist = books.filter(b => b.status === 'deseado');

    // Total pages read
    const pagesRead = books.reduce((acc, b) => {
      if (b.status === 'leido') return acc + (b.totalPages || 0);
      return acc + (b.currentPage || 0);
    }, 0);

    // Total pages in catalog
    const totalPagesCatalog = books.reduce((acc, b) => acc + (b.totalPages || 0), 0);

    // Average rating of finished books with rating > 0
    const ratedBooks = completed.filter(b => (b.rating || 0) > 0);
    const avgRating = ratedBooks.length > 0 
      ? (ratedBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / ratedBooks.length).toFixed(1)
      : '5.0';

    // Current Year Completed Books
    const currentYear = new Date().getFullYear();
    const completedThisYear = completed.filter(b => {
      if (!b.finishDate) return true; // count if completed without specific date
      return b.finishDate.startsWith(String(currentYear));
    }).length;

    const goalProgressPct = Math.min(100, Math.round((completedThisYear / (annualReadingGoal || 1)) * 100));

    return {
      total,
      readingCount: reading.length,
      completedCount: completed.length,
      toReadCount: toRead.length,
      wishlistCount: wishlist.length,
      pagesRead,
      totalPagesCatalog,
      avgRating,
      completedThisYear,
      goalProgressPct,
      currentReadingBook: reading[0] || null,
    };
  }, [books, annualReadingGoal]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Tab filter
      if (activeTab === 'leyendo' && book.status !== 'leyendo') return false;
      if (activeTab === 'por_leer' && book.status !== 'por_leer') return false;
      if (activeTab === 'leido' && book.status !== 'leido') return false;
      if (activeTab === 'deseado' && book.status !== 'deseado') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = (book.title || '').toLowerCase().includes(query);
        const matchesAuthor = (book.author || '').toLowerCase().includes(query);
        const matchesTakeaway = (book.keyTakeaway || '').toLowerCase().includes(query);
        const matchesTags = (book.tags || []).some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesAuthor && !matchesTakeaway && !matchesTags) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && book.category !== categoryFilter) return false;

      // Format filter
      if (formatFilter !== 'all' && book.format !== formatFilter) return false;

      return true;
    });
  }, [books, activeTab, searchTerm, categoryFilter, formatFilter]);

  // Handlers
  const handleOpenAddModal = (preset?: typeof QUICK_BOOK_SUGGESTIONS[0]) => {
    setEditingBook(null);
    if (preset) {
      setFormTitle(preset.title);
      setFormAuthor(preset.author);
      setFormCategory(preset.category as BookCategory);
      setFormStatus('por_leer');
      setFormFormat(preset.format);
      setFormTotalPages(preset.totalPages);
      setFormCurrentPage(0);
      setFormRating(5);
      setFormCoverGradient(preset.coverGradient);
      setFormCoverEmoji(preset.coverEmoji);
      setFormKeyTakeaway(preset.keyTakeaway || '');
      setFormTags(preset.tags ? preset.tags.join(', ') : '');
      setFormSummary('');
      setFormFavoriteQuote('');
      setFormRecommendedBy('');
      setFormStartDate('');
      setFormFinishDate('');
    } else {
      setFormTitle('');
      setFormAuthor('');
      setFormCategory('desarrollo_personal');
      setFormStatus('por_leer');
      setFormFormat('fisico');
      setFormTotalPages(320);
      setFormCurrentPage(0);
      setFormRating(5);
      setFormCoverGradient('from-amber-500 via-orange-600 to-amber-950');
      setFormCoverEmoji('📖');
      setFormStartDate('');
      setFormFinishDate('');
      setFormKeyTakeaway('');
      setFormSummary('');
      setFormFavoriteQuote('');
      setFormRecommendedBy('');
      setFormTags('');
    }
    setIsBookModalOpen(true);
  };

  const handleOpenEditModal = (book: BookItem) => {
    setEditingBook(book);
    setFormTitle(book.title || '');
    setFormAuthor(book.author || '');
    setFormCategory((book.category as BookCategory) || 'desarrollo_personal');
    setFormStatus(book.status || 'por_leer');
    setFormFormat(book.format || 'fisico');
    setFormTotalPages(book.totalPages || 300);
    setFormCurrentPage(book.currentPage || 0);
    setFormRating(book.rating || 5);
    setFormCoverGradient(book.coverGradient || 'from-amber-500 via-orange-600 to-amber-950');
    setFormCoverEmoji(book.coverEmoji || '📖');
    setFormStartDate(book.startDate || '');
    setFormFinishDate(book.finishDate || '');
    setFormKeyTakeaway(book.keyTakeaway || '');
    setFormSummary(book.summary || '');
    setFormFavoriteQuote(book.favoriteQuote || '');
    setFormRecommendedBy(book.recommendedBy || '');
    setFormTags(book.tags ? book.tags.join(', ') : '');
    setIsBookModalOpen(true);
  };

  const handleSaveBookForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const categoryObj = BOOK_CATEGORIES.find(c => c.id === formCategory);
    const categoryLabel = categoryObj ? categoryObj.label : 'Lectura';

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const safeTotalPages = Math.max(1, Number(formTotalPages) || 1);
    const safeCurrentPage = Math.min(safeTotalPages, Math.max(0, Number(formCurrentPage) || 0));

    // Auto-update status if finished
    let finalStatus = formStatus;
    let finalFinishDate = formFinishDate;
    if (safeCurrentPage >= safeTotalPages && formStatus === 'leyendo') {
      finalStatus = 'leido';
      if (!finalFinishDate) {
        finalFinishDate = new Date().toISOString().split('T')[0];
      }
    }

    if (editingBook) {
      const updated: BookItem = {
        ...editingBook,
        title: formTitle.trim(),
        author: formAuthor.trim() || 'Autor Desconocido',
        category: formCategory,
        categoryLabel,
        status: finalStatus,
        format: formFormat,
        totalPages: safeTotalPages,
        currentPage: safeCurrentPage,
        rating: Number(formRating) || 5,
        coverGradient: formCoverGradient,
        coverEmoji: formCoverEmoji,
        startDate: formStartDate || editingBook.startDate,
        finishDate: finalFinishDate || editingBook.finishDate,
        keyTakeaway: formKeyTakeaway.trim(),
        summary: formSummary.trim(),
        favoriteQuote: formFavoriteQuote.trim(),
        recommendedBy: formRecommendedBy.trim(),
        tags: tagsArray,
        updatedAt: new Date().toISOString(),
      };
      onUpdateBook(updated);
      if (selectedBookDetail?.id === updated.id) {
        setSelectedBookDetail(updated);
      }
    } else {
      const newBook: Omit<BookItem, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formTitle.trim(),
        author: formAuthor.trim() || 'Autor Desconocido',
        category: formCategory,
        categoryLabel,
        status: finalStatus,
        format: formFormat,
        totalPages: safeTotalPages,
        currentPage: safeCurrentPage,
        rating: Number(formRating) || 5,
        coverGradient: formCoverGradient,
        coverEmoji: formCoverEmoji,
        startDate: formStartDate || (finalStatus === 'leyendo' ? new Date().toISOString().split('T')[0] : undefined),
        finishDate: finalFinishDate || (finalStatus === 'leido' ? new Date().toISOString().split('T')[0] : undefined),
        keyTakeaway: formKeyTakeaway.trim(),
        summary: formSummary.trim(),
        favoriteQuote: formFavoriteQuote.trim(),
        recommendedBy: formRecommendedBy.trim(),
        tags: tagsArray,
        notesHistory: [],
      };
      onAddBook(newBook);
    }

    setIsBookModalOpen(false);
  };

  const handleOpenProgressModal = (book: BookItem) => {
    setProgressBook(book);
    setNewCurrentPageInput(book.currentPage || 0);
    setSessionNoteInput('');
    setIsProgressModalOpen(true);
  };

  const handleSaveProgress = () => {
    if (!progressBook) return;

    const safeTotal = progressBook.totalPages || 100;
    const safeCurrent = Math.min(safeTotal, Math.max(0, Number(newCurrentPageInput) || 0));

    if (onQuickUpdateProgress) {
      onQuickUpdateProgress(progressBook.id, safeCurrent, sessionNoteInput.trim() || undefined);
    } else {
      const isNowCompleted = safeCurrent >= safeTotal;
      const todayStr = new Date().toISOString().split('T')[0];

      const newNotes: ReadingSessionNote[] = [...(progressBook.notesHistory || [])];
      if (sessionNoteInput.trim()) {
        newNotes.push({
          id: `note-${Date.now()}`,
          date: todayStr,
          page: safeCurrent,
          text: sessionNoteInput.trim(),
        });
      }

      const updated: BookItem = {
        ...progressBook,
        currentPage: safeCurrent,
        status: isNowCompleted ? 'leido' : progressBook.status === 'por_leer' ? 'leyendo' : progressBook.status,
        finishDate: isNowCompleted ? (progressBook.finishDate || todayStr) : progressBook.finishDate,
        startDate: progressBook.startDate || (progressBook.status === 'por_leer' ? todayStr : progressBook.startDate),
        notesHistory: newNotes,
        updatedAt: new Date().toISOString(),
      };
      onUpdateBook(updated);
      if (selectedBookDetail?.id === updated.id) {
        setSelectedBookDetail(updated);
      }
    }

    setIsProgressModalOpen(false);
  };

  const handleQuickAdvancePages = (book: BookItem, delta: number) => {
    const safeTotal = book.totalPages || 100;
    const newPage = Math.min(safeTotal, Math.max(0, (book.currentPage || 0) + delta));
    const isNowCompleted = newPage >= safeTotal;
    const todayStr = new Date().toISOString().split('T')[0];

    const updated: BookItem = {
      ...book,
      currentPage: newPage,
      status: isNowCompleted ? 'leido' : book.status === 'por_leer' ? 'leyendo' : book.status,
      finishDate: isNowCompleted ? (book.finishDate || todayStr) : book.finishDate,
      startDate: book.startDate || todayStr,
      updatedAt: new Date().toISOString(),
    };
    onUpdateBook(updated);
    if (selectedBookDetail?.id === updated.id) {
      setSelectedBookDetail(updated);
    }
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;

    if (onAddQuote) {
      onAddQuote({
        quote: newQuoteText.trim(),
        bookTitle: newQuoteBook.trim() || 'Libro sin título',
        author: newQuoteAuthor.trim() || 'Autor',
        page: newQuotePage ? Number(newQuotePage) : undefined,
        reflection: newQuoteReflection.trim() || undefined,
        favorite: true,
      });
    }

    setNewQuoteText('');
    setNewQuoteBook('');
    setNewQuoteAuthor('');
    setNewQuotePage('');
    setNewQuoteReflection('');
    setIsQuoteModalOpen(false);
  };

  const getFormatIcon = (format: BookFormat) => {
    switch (format) {
      case 'kindle_ebook': return <Smartphone className="w-3.5 h-3.5" />;
      case 'audiolibro': return <Headphones className="w-3.5 h-3.5" />;
      case 'pdf': return <FileText className="w-3.5 h-3.5" />;
      default: return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  const getFormatLabel = (format: BookFormat) => {
    switch (format) {
      case 'kindle_ebook': return 'Kindle / eBook';
      case 'audiolibro': return 'Audiolibro';
      case 'pdf': return 'PDF Digital';
      default: return 'Libro Físico';
    }
  };

  const getStatusBadge = (status: BookStatus) => {
    switch (status) {
      case 'leyendo':
        return { label: '📖 Leyendo', color: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'leido':
        return { label: '✅ Leído', color: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'deseado':
        return { label: '✨ Deseado', color: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'abandonado':
        return { label: '⏸️ Pausado', color: isDark ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-200 text-slate-700 border-slate-300' };
      default:
        return { label: '⏳ Por Leer', color: isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border-cyan-200' };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: INSPIRING LIBRARY HEADLINE & READING CHALLENGE             */}
      {/* ========================================================================= */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-xl transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-[#0c162d] via-[#102042] to-[#0a1122] border-blue-900/50 shadow-blue-950/40' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50/70 to-amber-50/40 border-blue-200/80 shadow-blue-100/50'
      }`}>
        {/* Subtle Background Glow & Accent Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Title & Inspiring Motto */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm ${
              isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800/80' : 'bg-blue-100 text-blue-900 border-blue-300'
            }">
              <BookOpen className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Santuario de Lectura & Nuevas Habilidades</span>
            </div>

            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              📚 Mi Biblioteca Personal & Estantería de Libros
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed italic ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              "Un lector vive mil vidas antes de morir. Aquel que nunca lee, vive solo una."
              <span className="block not-italic text-xs font-semibold mt-1 opacity-80">— George R.R. Martin</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>+ Añadir Libro</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQuoteModalOpen(true)}
              className={`px-4 py-3.5 rounded-2xl font-bold text-sm border transition-all flex items-center space-x-2 cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-amber-300 hover:text-amber-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              <Quote className="w-4 h-4 text-amber-500" />
              <span>+ Guardar Cita</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATS RIBBON: LIBROS LEÍDOS, PÁGINAS, META ANUAL & LEYENDO AHORA         */}
        {/* ========================================================================= */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Reto Anual */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f1b35]/80 border-blue-900/40' : 'bg-white/90 border-blue-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                🎯 Reto Anual {new Date().getFullYear()}
              </span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.completedThisYear}
              </span>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                / {annualReadingGoal} libros
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.goalProgressPct}%` }}
              />
            </div>
          </div>

          {/* Card 2: Páginas Devoradas */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f1b35]/80 border-blue-900/40' : 'bg-white/90 border-blue-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                📖 Páginas Leídas
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.pagesRead.toLocaleString('es-CO')}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>págs</span>
            </div>
            <p className={`text-xs mt-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              En {stats.total} libros catalogados
            </p>
          </div>

          {/* Card 3: Leyendo Actualmente */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f1b35]/80 border-blue-900/40' : 'bg-white/90 border-blue-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                ⚡ Leyendo Ahora
              </span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.readingCount}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>en progreso</span>
            </div>
            <p className={`text-xs mt-1 truncate ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
              {stats.currentReadingBook ? stats.currentReadingBook.title : 'Selecciona tu próxima lectura'}
            </p>
          </div>

          {/* Card 4: Calificación Media */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f1b35]/80 border-blue-900/40' : 'bg-white/90 border-blue-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                ⭐ Calificación Media
              </span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.avgRating}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ 5.0</span>
            </div>
            <p className={`text-xs mt-1 truncate ${isDark ? 'text-emerald-300/90' : 'text-emerald-800'}`}>
              {stats.completedCount} libros completados
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE FILTROS, TABS DE ESTADO & SELECTOR DE VISTA                   */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* State Tabs Ribbon */}
        <div className={`flex items-center justify-between gap-2 overflow-x-auto p-1.5 rounded-2xl border ${
          isDark ? 'bg-[#0c1427] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Todos los Libros</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 font-mono">
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leyendo')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'leyendo'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>📖 Leyendo Ahora</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 font-mono">
                {stats.readingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('por_leer')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'por_leer'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>⏳ Por Leer</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 font-mono">
                {stats.toReadCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leido')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'leido'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>✅ Leídos & Reseñas</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 font-mono">
                {stats.completedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('deseado')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'deseado'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ Wishlist</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 font-mono">
                {stats.wishlistCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('citas')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'citas'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Quote className="w-4 h-4 text-amber-400" />
              <span>💬 Citas & Frases</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-black/20 font-mono">
                {readingQuotes.length}
              </span>
            </button>
          </div>

          {/* Layout Mode Toggles (Shelf vs Grid vs Compact) */}
          {activeTab !== 'citas' && (
            <div className="hidden sm:flex items-center gap-1 bg-black/10 dark:bg-black/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayout('shelf')}
                title="Vista Estantería Visual 3D"
                className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewLayout === 'shelf'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookMarked className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                title="Vista Cuadrícula de Tarjetas"
                className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Dropdowns (When not on Citas tab) */}
        {activeTab !== 'citas' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, autor, idea clave o etiqueta..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-[#0f172a] border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-auto min-w-[200px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'bg-[#0f172a] border-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">Todas las Categorías</option>
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div className="w-full sm:w-auto min-w-[160px]">
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'bg-[#0f172a] border-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">Todos los Formatos</option>
                <option value="fisico">📖 Libro Físico</option>
                <option value="kindle_ebook">📱 Kindle / eBook</option>
                <option value="audiolibro">🎧 Audiolibro</option>
                <option value="pdf">📄 PDF Digital</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: BOOKS RENDERING (SHELF vs GRID vs CITAS)                 */}
      {/* ========================================================================= */}
      {activeTab === 'citas' ? (
        /* CITAS & FRASES MEMORABLES VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg sm:text-xl font-bold flex items-center space-x-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Quote className="w-5 h-5 text-amber-500" />
              <span>Mural de Citas & Reflexiones Inolvidables</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cita</span>
            </button>
          </div>

          {readingQuotes.length === 0 ? (
            <div className={`text-center py-16 px-4 rounded-3xl border border-dashed ${
              isDark ? 'border-slate-800 bg-[#0c1427]/40' : 'border-slate-300 bg-slate-50'
            }`}>
              <Quote className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
              <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aún no has guardado citas memorables
              </h4>
              <p className={`text-sm mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Captura las frases que te hagan reflexionar o cambien tu perspectiva mientras lees.
              </p>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Escribir Primera Cita</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingQuotes.map((q) => (
                <div
                  key={q.id}
                  className={`p-6 rounded-3xl border relative transition-all group hover:shadow-lg ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#0e1933] to-[#0c1427] border-slate-800 hover:border-amber-500/40' 
                      : 'bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border-amber-200/70 hover:border-amber-400'
                  }`}
                >
                  <Quote className="w-8 h-8 text-amber-500/20 absolute top-4 right-4 pointer-events-none" />

                  <p className={`text-base sm:text-lg font-serif italic leading-relaxed ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    "{q.quote}"
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {q.bookTitle}
                        </span>
                        {q.page && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            pág. {q.page}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-medium ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
                        {q.author}
                      </p>
                    </div>

                    {onDeleteQuote && (
                      <button
                        type="button"
                        onClick={() => onDeleteQuote(q.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Eliminar cita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {q.reflection && (
                    <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed ${
                      isDark ? 'bg-blue-950/40 text-blue-200 border border-blue-900/40' : 'bg-blue-50 text-blue-900 border border-blue-200/60'
                    }`}>
                      <span className="font-bold flex items-center space-x-1 mb-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reflexión personal:</span>
                      </span>
                      {q.reflection}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredBooks.length === 0 ? (
        /* EMPTY STATE */
        <div className={`text-center py-20 px-6 rounded-3xl border border-dashed ${
          isDark ? 'border-slate-800 bg-[#0c1427]/40' : 'border-slate-300 bg-slate-50'
        }`}>
          <BookOpen className="w-14 h-14 text-blue-500/40 mx-auto mb-4 animate-bounce" />
          <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No hay libros en esta sección
          </h3>
          <p className={`text-sm mt-1.5 max-w-md mx-auto leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {searchTerm || categoryFilter !== 'all' || formatFilter !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda o categoría.'
              : 'Empieza tu biblioteca añadiendo tu libro favorito o usando una de nuestras recomendaciones populares.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-5 py-3 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Libro Personalizado</span>
            </button>
          </div>

          {/* Quick Starter Suggestions */}
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 max-w-3xl mx-auto">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              💡 Sugerencias Rápidas para Añadir con 1 Clic:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_BOOK_SUGGESTIONS.slice(0, 5).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOpenAddModal(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800/80 hover:bg-blue-600 border-slate-700 text-slate-200 hover:text-white' 
                      : 'bg-white hover:bg-blue-600 border-slate-200 text-slate-800 hover:text-white shadow-sm'
                  }`}
                >
                  <span>{preset.coverEmoji}</span>
                  <span>{preset.title}</span>
                  <Plus className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* BOOKS DISPLAY */
        <div className={
          viewLayout === 'shelf'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4'
        }>
          {filteredBooks.map((book) => {
            const statusBadge = getStatusBadge(book.status);
            const pct = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
            const categoryObj = BOOK_CATEGORIES.find(c => c.id === book.category);

            return (
              <div
                key={book.id}
                className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#0d172e] border-slate-800 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/50'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl'
                }`}
              >
                {/* Book Header / 3D Stylized Book Cover */}
                <div className={`relative p-6 bg-gradient-to-br ${book.coverGradient || 'from-amber-600 via-orange-700 to-amber-950'} text-white overflow-hidden`}>
                  {/* Spine Shading & Ribbon */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/25 shadow-inner" />
                  <div className="absolute top-0 right-6 w-5 h-8 bg-amber-400 shadow-md rounded-b-md flex items-center justify-center pointer-events-none">
                    <Bookmark className="w-3 h-3 text-amber-950 fill-amber-950" />
                  </div>

                  {/* Status & Format Badges */}
                  <div className="flex items-center justify-between pl-3 pr-8">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${
                      book.status === 'leido'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                        : book.status === 'leyendo'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                        : 'bg-slate-950/80 text-slate-300 border-slate-700'
                    }`}>
                      {statusBadge.label}
                    </span>

                    <span className="flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-black/30 backdrop-blur-sm">
                      {getFormatIcon(book.format)}
                      <span>{getFormatLabel(book.format)}</span>
                    </span>
                  </div>

                  {/* Book Title & Author in Book typography */}
                  <div className="mt-6 pl-3">
                    <div className="text-2xl mb-1 drop-shadow-md">
                      {book.coverEmoji || '📖'}
                    </div>
                    <h3 className="font-serif font-bold text-lg sm:text-xl leading-snug drop-shadow line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-sans font-medium opacity-90 mt-1 line-clamp-1">
                      de <span className="font-bold">{book.author}</span>
                    </p>
                  </div>

                  {/* Star Rating Badge (If finished or rated) */}
                  {(book.rating || 0) > 0 && (
                    <div className="mt-4 pl-3 flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (book.rating || 0)
                              ? 'text-amber-300 fill-amber-300 drop-shadow'
                              : 'text-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Book Body: Progress, Category & Key Takeaway */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category Label */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold px-2 py-0.5 rounded-md ${
                        isDark ? 'bg-slate-800 text-blue-300' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {categoryObj?.icon} {book.categoryLabel || categoryObj?.label || 'General'}
                      </span>

                      {book.status === 'leido' && book.finishDate && (
                        <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Terminado: {book.finishDate}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar (For active / reading books) */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          Progreso: {book.currentPage} / {book.totalPages} págs
                        </span>
                        <span className={`font-mono font-bold ${
                          pct === 100 ? 'text-emerald-500' : 'text-blue-500'
                        }`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct === 100
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Takeaway or Summary snippet */}
                    {book.keyTakeaway ? (
                      <div className={`mt-3.5 p-3 rounded-2xl text-xs leading-relaxed ${
                        isDark ? 'bg-slate-800/60 text-slate-300 border border-slate-700/60' : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        <span className="font-bold flex items-center space-x-1 text-amber-500 mb-1">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Aprendizaje Clave:</span>
                        </span>
                        <p className="line-clamp-2 italic">
                          "{book.keyTakeaway}"
                        </p>
                      </div>
                    ) : book.summary ? (
                      <p className={`mt-3 text-xs line-clamp-2 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {book.summary}
                      </p>
                    ) : null}

                    {/* Tags */}
                    {book.tags && book.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {book.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Quick Page Update Buttons */}
                    {book.status !== 'leido' ? (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdvancePages(book, 10)}
                          title="Avanzar 10 páginas rápidamente"
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border-slate-700' 
                              : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border-slate-200'
                          }`}
                        >
                          +10p
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdvancePages(book, 25)}
                          title="Avanzar 25 páginas"
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border-slate-700' 
                              : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border-slate-200'
                          }`}
                        >
                          +25p
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenProgressModal(book)}
                          title="Registrar avance exacto"
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isDark ? 'text-blue-400 hover:bg-blue-950' : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedBookDetail(book)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                          isDark 
                            ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ver Ficha & Notas</span>
                      </button>
                    )}

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBookDetail(book)}
                        title="Ver detalle completo"
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(book)}
                        title="Editar información"
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteBook(book.id)}
                        title="Eliminar de mi biblioteca"
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: AGREGAR / EDITAR LIBRO                                          */}
      {/* ========================================================================= */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {editingBook ? 'Editar Libro' : 'Añadir Nuevo Libro a mi Biblioteca'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Registra los detalles, formato, portada y aprendizajes clave.
                </p>
              </div>
            </div>

            {/* Quick Best Sellers presets if creating new */}
            {!editingBook && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-bold text-blue-400 block mb-2">
                  ✨ ¿Deseas autocompletar con un Best Seller popular?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_BOOK_SUGGESTIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOpenAddModal(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        formTitle === preset.title
                          ? 'bg-blue-600 text-white border-blue-500'
                          : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.coverEmoji} {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveBookForm} className="space-y-4">
              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Título del Libro *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Hábitos Atómicos, Sapiens..."
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Autor(a) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Ej: James Clear, Morgan Housel..."
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Status, Category & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Estado de Lectura
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as BookStatus)}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="por_leer">⏳ Por Leer (Pendiente)</option>
                    <option value="leyendo">📖 Leyendo Ahora</option>
                    <option value="leido">✅ Leído (Completado)</option>
                    <option value="deseado">✨ Deseado (Wishlist)</option>
                    <option value="abandonado">⏸️ Pausado / Abandonado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Categoría / Género
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BookCategory)}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Formato
                  </label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as BookFormat)}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="fisico">📖 Libro Físico (Papel)</option>
                    <option value="kindle_ebook">📱 Kindle / eBook</option>
                    <option value="audiolibro">🎧 Audiolibro</option>
                    <option value="pdf">📄 PDF Digital</option>
                  </select>
                </div>
              </div>

              {/* Pages: Total Pages & Current Page */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Total de Páginas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalPages}
                    onChange={(e) => setFormTotalPages(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Página Actual ({Math.min(100, Math.round(((Number(formCurrentPage) || 0) / (Number(formTotalPages) || 1)) * 100))}%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formTotalPages}
                    value={formCurrentPage}
                    onChange={(e) => setFormCurrentPage(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Calificación (Estrellas)
                  </label>
                  <div className="flex items-center space-x-1 py-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormRating(s)}
                        className="cursor-pointer p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= formRating
                              ? 'text-amber-400 fill-amber-400 drop-shadow'
                              : isDark ? 'text-slate-600' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold ml-2">{formRating}/5</span>
                  </div>
                </div>
              </div>

              {/* Cover Gradient and Emoji */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Color / Gradiente de Portada
                  </label>
                  <select
                    value={formCoverGradient}
                    onChange={(e) => setFormCoverGradient(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {COVER_GRADIENT_PRESETS.map((p, idx) => (
                      <option key={idx} value={p.gradient}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Emoji de Portada
                  </label>
                  <input
                    type="text"
                    value={formCoverEmoji}
                    onChange={(e) => setFormCoverEmoji(e.target.value)}
                    placeholder="Ej: 📖, ⚡, 💰, 🧠, 🏛️, 🚀"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Key Takeaway & Memorable Quote */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Mayor Aprendizaje / Frase Clave
                </label>
                <textarea
                  rows={2}
                  value={formKeyTakeaway}
                  onChange={(e) => setFormKeyTakeaway(e.target.value)}
                  placeholder="¿Cuál es la lección más importante o idea accionable que te dejó este libro?"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Summary / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Resumen o Reflexión Personal
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Breve sinopsis, ideas centrales o por qué te interesó..."
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Etiquetas (separadas por comas)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Ej: Hábitos, Finanzas, Psicología, Disciplina"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  {editingBook ? 'Guardar Cambios' : 'Añadir a mi Biblioteca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ACTUALIZAR AVANCE DE PÁGINAS RÁPIDO                             */}
      {/* ========================================================================= */}
      {isProgressModalOpen && progressBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`relative w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setIsProgressModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Registrar Avance de Lectura
                </h3>
                <p className={`text-xs font-medium truncate max-w-[220px] ${
                  isDark ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  {progressBook.title}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>Página a la que llegaste hoy:</span>
                  <span className="font-mono text-blue-500">
                    Total: {progressBook.totalPages} págs
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={progressBook.totalPages}
                  value={newCurrentPageInput}
                  onChange={(e) => setNewCurrentPageInput(Number(e.target.value))}
                  className={`w-full px-4 py-3 rounded-2xl border text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Quick increment buttons */}
              <div className="flex items-center justify-between gap-1.5">
                {[+5, +10, +20, +50].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setNewCurrentPageInput(Math.min(progressBook.totalPages, newCurrentPageInput + inc))}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border-slate-700' : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border-slate-200'
                    }`}
                  >
                    +{inc}p
                  </button>
                ))}
              </div>

              {/* Progress visual bar */}
              <div className="p-3 rounded-2xl bg-black/10 dark:bg-black/40">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span>Porcentaje:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {Math.min(100, Math.round((newCurrentPageInput / progressBook.totalPages) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((newCurrentPageInput / progressBook.totalPages) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Session note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Nota rápida de esta sesión (opcional)
                </label>
                <input
                  type="text"
                  value={sessionNoteInput}
                  onChange={(e) => setSessionNoteInput(e.target.value)}
                  placeholder="Ej: Terminé el capítulo 3 sobre mentalidad..."
                  className={`w-full px-4 py-2 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer"
                >
                  Guardar Progreso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DETALLE COMPLETO DEL LIBRO                                      */}
      {/* ========================================================================= */}
      {selectedBookDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedBookDetail(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with gradient */}
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${selectedBookDetail.coverGradient || 'from-amber-600 via-orange-700 to-amber-950'} text-white mb-6 shadow-lg`}>
              <span className="text-3xl">{selectedBookDetail.coverEmoji || '📖'}</span>
              <h3 className="text-2xl font-serif font-bold mt-2">{selectedBookDetail.title}</h3>
              <p className="text-sm font-medium opacity-90">de {selectedBookDetail.author}</p>
              
              <div className="mt-4 flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-black/30 backdrop-blur-sm">
                  {getStatusBadge(selectedBookDetail.status).label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/30 backdrop-blur-sm">
                  {getFormatLabel(selectedBookDetail.format)}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Progress */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1.5 text-xs">
                  <span>Progreso de Lectura:</span>
                  <span className="font-mono text-blue-500">
                    {selectedBookDetail.currentPage} / {selectedBookDetail.totalPages} págs (
                    {Math.min(100, Math.round((selectedBookDetail.currentPage / selectedBookDetail.totalPages) * 100))}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.round((selectedBookDetail.currentPage / selectedBookDetail.totalPages) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Key takeaway */}
              {selectedBookDetail.keyTakeaway && (
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span className="font-bold text-xs uppercase tracking-wider block mb-1">
                    💡 Mayor Aprendizaje:
                  </span>
                  <p className="italic leading-relaxed font-serif">
                    "{selectedBookDetail.keyTakeaway}"
                  </p>
                </div>
              )}

              {/* Summary */}
              {selectedBookDetail.summary && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block mb-1 text-slate-400">
                    Resumen & Notas:
                  </span>
                  <p className="leading-relaxed text-xs sm:text-sm">
                    {selectedBookDetail.summary}
                  </p>
                </div>
              )}

              {/* Reading Session Notes History */}
              {selectedBookDetail.notesHistory && selectedBookDetail.notesHistory.length > 0 && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block mb-2 text-slate-400">
                    📝 Historial de Sesiones de Lectura:
                  </span>
                  <div className="space-y-2">
                    {selectedBookDetail.notesHistory.map((note) => (
                      <div
                        key={note.id}
                        className={`p-2.5 rounded-xl text-xs border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 mb-0.5">
                          <span>{note.date}</span>
                          {note.page && <span>pág. {note.page}</span>}
                        </div>
                        <p>{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions in detail modal */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookDetail(null);
                    handleOpenEditModal(selectedBookDetail);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  Editar Información
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: GUARDAR CITA MEMORABLE                                          */}
      {/* ========================================================================= */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              type="button"
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <Quote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  Guardar Cita o Frase Memorable
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Conserva las palabras que te inspiran en tu diario de lectura.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Cita Textual *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder='Ej: "No te elevas al nivel de tus metas, desciendes al nivel de tus sistemas."'
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Libro
                  </label>
                  <input
                    type="text"
                    value={newQuoteBook}
                    onChange={(e) => setNewQuoteBook(e.target.value)}
                    placeholder="Ej: Hábitos Atómicos"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Autor(a)
                  </label>
                  <input
                    type="text"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    placeholder="Ej: James Clear"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Reflexión o aplicación personal
                </label>
                <textarea
                  rows={2}
                  value={newQuoteReflection}
                  onChange={(e) => setNewQuoteReflection(e.target.value)}
                  placeholder="¿Cómo aplicas esta enseñanza a tu día a día?"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer"
                >
                  Guardar en mi Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

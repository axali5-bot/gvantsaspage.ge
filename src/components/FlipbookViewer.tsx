import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipbookPage {
    id: string;
    image_url: string;
    page_number: number;
}

interface FlipbookViewerProps {
    pages: FlipbookPage[];
    brand: string;
}

const FlipbookViewer = ({ pages, brand }: FlipbookViewerProps) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

    // Handle page flip animation
    const flipToPage = (newDirection: 'next' | 'prev') => {
        const newPage = newDirection === 'next'
            ? Math.min(currentPage + 1, pages.length - 1)
            : Math.max(currentPage - 1, 0);

        if (newPage === currentPage) return;

        setDirection(newDirection === 'next' ? 1 : -1);
        setCurrentPage(newPage);
    };

    // Touch/Swipe handling for mobile
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            flipToPage('next');
        }
        if (isRightSwipe) {
            flipToPage('prev');
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') flipToPage('next');
            if (e.key === 'ArrowLeft') flipToPage('prev');
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentPage, isFullscreen]);

    // Zoom controls
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    if (pages.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground font-body">კატალოგი ჯერ არ არის ატვირთული</p>
            </div>
        );
    }

    return (
        <>
            {/* Flipbook Container */}
            <div className="relative w-full">
                {/* Header Controls */}
                <div className="flex items-center justify-between mb-6 px-4">
                    <div className="flex items-center gap-4">
                        <h2 className="font-display text-2xl uppercase tracking-wider">
                            {brand} Catalog
                        </h2>
                        <span className="text-sm text-muted-foreground font-body">
                            Page {currentPage + 1} / {pages.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={zoomLevel <= 0.5}
                        >
                            <ZoomOut size={18} />
                        </Button>
                        <span className="text-sm font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={zoomLevel >= 3}
                        >
                            <ZoomIn size={18} />
                        </Button>
                    </div>
                </div>

                {/* Flipbook Viewer */}
                <div
                    className="relative mx-auto max-w-4xl"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Page Display */}
                    <div className="relative aspect-[3/4] bg-white rounded-lg shadow-2xl overflow-hidden cursor-pointer">
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={currentPage}
                                custom={direction}
                                variants={{
                                    enter: (direction: number) => ({
                                        x: direction > 0 ? 1000 : -1000,
                                        opacity: 0,
                                        rotateY: direction > 0 ? -90 : 90
                                    }),
                                    center: {
                                        zIndex: 1,
                                        x: 0,
                                        opacity: 1,
                                        rotateY: 0
                                    },
                                    exit: (direction: number) => ({
                                        zIndex: 0,
                                        x: direction < 0 ? 1000 : -1000,
                                        opacity: 0,
                                        rotateY: direction < 0 ? -90 : 90
                                    })
                                }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                    rotateY: { duration: 0.4 }
                                }}
                                className="absolute inset-0 w-full h-full backface-hidden"
                                onClick={() => setIsFullscreen(true)}
                            >
                                <img
                                    src={pages[currentPage]?.image_url}
                                    alt={`Page ${currentPage + 1}`}
                                    className="w-full h-full object-contain"
                                    style={{
                                        transform: `scale(${zoomLevel})`,
                                        transition: 'transform 0.3s ease-out'
                                    }}
                                />

                                {/* Page Number Overlay */}
                                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-mono">
                                    {currentPage + 1}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <Button
                        variant="default"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg bg-amber-600 hover:bg-amber-700"
                        onClick={() => flipToPage('prev')}
                        disabled={currentPage === 0}
                    >
                        <ChevronLeft size={24} />
                    </Button>

                    <Button
                        variant="default"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg bg-amber-600 hover:bg-amber-700"
                        onClick={() => flipToPage('next')}
                        disabled={currentPage === pages.length - 1}
                    >
                        <ChevronRight size={24} />
                    </Button>
                </div>

                {/* Page Thumbnails */}
                <div className="mt-8 overflow-x-auto">
                    <div className="flex gap-3 pb-4 px-4">
                        {pages.map((page, index) => (
                            <motion.div
                                key={page.id}
                                className={`relative flex-shrink-0 w-20 h-28 rounded border-2 cursor-pointer overflow-hidden ${index === currentPage
                                    ? 'border-amber-500 ring-2 ring-amber-500/50'
                                    : 'border-border hover:border-amber-400'
                                    }`}
                                onClick={() => {
                                    if (index !== currentPage) {
                                        setDirection(index > currentPage ? 1 : -1);
                                        setCurrentPage(index);
                                    }
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <img
                                    src={page.image_url}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                                    {index + 1}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20"
                            onClick={() => setIsFullscreen(false)}
                        >
                            <X size={24} />
                        </Button>

                        <img
                            src={pages[currentPage]?.image_url}
                            alt={`Page ${currentPage + 1}`}
                            className="max-w-[90vw] max-h-[90vh] object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Fullscreen Navigation */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); flipToPage('prev'); }}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft size={20} />
                            </Button>
                            <span className="text-white font-mono text-sm">
                                {currentPage + 1} / {pages.length}
                            </span>
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); flipToPage('next'); }}
                                disabled={currentPage === pages.length - 1}
                            >
                                <ChevronRight size={20} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FlipbookViewer;

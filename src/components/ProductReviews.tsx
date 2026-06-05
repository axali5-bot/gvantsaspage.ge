import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });

/** Static star row (display). */
const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        className={n <= Math.round(value) ? 'fill-gold text-gold' : 'fill-muted text-muted'}
      />
    ))}
  </span>
);

export const ProductReviews = ({ productId }: { productId: string }) => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id, user_id, rating, comment, reviewer_name, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const myReview = reviews.find((r) => r.user_id === user?.id);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not logged in');
      if (rating < 1) throw new Error('no rating');
      const { error } = await supabase.from('reviews').upsert(
        {
          product_id: productId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
          reviewer_name: profile?.full_name || user.email?.split('@')[0] || 'მომხმარებელი',
        },
        { onConflict: 'product_id,user_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('მადლობა შეფასებისთვის! 🌹');
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      qc.invalidateQueries({ queryKey: ['product-ratings'] });
      setComment('');
    },
    onError: (e) => {
      if ((e as Error).message === 'no rating') toast.error('აირჩიე შეფასება (ვარსკვლავები)');
      else toast.error('ვერ გაიგზავნა');
    },
  });

  return (
    <section className="mt-24 pt-16 border-t border-border/40">
      <div className="flex items-center justify-center gap-3 mb-10">
        <h2 className="font-display text-xl lg:text-3xl tracking-[0.2em] uppercase text-center">
          შეფასებები
        </h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Stars value={avg} size={16} />
            <span className="font-body text-sm">{avg.toFixed(1)} ({reviews.length})</span>
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Write / edit a review */}
        {user ? (
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-6 space-y-4">
            <p className="font-body text-sm text-gray-700">
              {myReview ? 'შენი შეფასების განახლება' : 'დატოვე შენი შეფასება'}
            </p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="p-0.5"
                >
                  <Star
                    size={26}
                    className={n <= (hover || rating || myReview?.rating || 0)
                      ? 'fill-gold text-gold transition-colors'
                      : 'fill-muted text-muted/60 transition-colors'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={myReview?.comment || 'რას ფიქრობ ამ არომატზე? (არასავალდებულო)'}
              className="w-full rounded-xl border border-rose-100 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 min-h-[80px] resize-none"
            />
            <button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="h-11 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-body tracking-widest uppercase disabled:opacity-50 transition-colors"
            >
              {submit.isPending ? '...' : myReview ? 'განახლება' : 'გაგზავნა'}
            </button>
          </div>
        ) : (
          <div className="text-center bg-rose-50/40 border border-rose-100 rounded-2xl p-6">
            <p className="font-body text-sm text-muted-foreground">
              შეფასების დასატოვებლად{' '}
              <Link to="/auth/login" className="text-rose-500 font-medium hover:underline">შედი ანგარიშზე</Link>
            </p>
          </div>
        )}

        {/* Existing reviews */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare size={28} className="mx-auto mb-3 opacity-40" />
            <p className="font-body text-sm">ჯერ შეფასება არ არის — იყავი პირველი! ✨</p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-rose-50 pb-5 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-body text-sm font-medium text-gray-800">
                    {r.reviewer_name || 'მომხმარებელი'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</span>
                </div>
                <Stars value={r.rating} />
                {r.comment && (
                  <p className="font-body text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

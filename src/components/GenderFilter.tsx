import { useTranslation } from 'react-i18next';

type GenderOption = 'all' | 'men' | 'women' | 'unisex';

interface GenderFilterProps {
  selected: GenderOption;
  onSelect: (gender: GenderOption) => void;
}

export const GenderFilter = ({ selected, onSelect }: GenderFilterProps) => {
  const { t } = useTranslation();

  const options: { value: GenderOption; label: string }[] = [
    { value: 'all', label: t('all') },
    { value: 'men', label: t('men') },
    { value: 'women', label: t('women') },
    { value: 'unisex', label: t('unisex') },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 py-6 md:py-8">
      <span className="font-body text-xs tracking-wider text-muted-foreground uppercase mr-2">
        {t('gender')}:
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`px-4 py-2 font-body text-xs md:text-sm tracking-wider uppercase transition-all duration-300 border ${
            selected === option.value
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-transparent text-foreground hover:border-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
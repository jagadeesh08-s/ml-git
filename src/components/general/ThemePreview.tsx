import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Eye, Check } from 'lucide-react';

interface ThemePreviewProps {
  themeName: string;
  themeValue: string;
  isActive: boolean;
  onSelect: (theme: string) => void;
  description: string;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  themeName,
  themeValue,
  isActive,
  onSelect,
  description
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isActive ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
      }`}
      onClick={() => onSelect(themeValue)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {themeName}
            {isActive && <Check className="h-4 w-4 text-primary" />}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Preview theme temporarily
              const originalTheme = document.documentElement.className;
              document.documentElement.className = themeValue;
              setTimeout(() => {
                document.documentElement.className = originalTheme;
              }, 2000);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <div className="flex gap-1 flex-wrap">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            Preview
          </Badge>
          {isActive && (
            <Badge variant="default" className="text-xs px-2 py-0.5">
              Active
            </Badge>
          )}
        </div>
        {/* Color swatches */}
        <div className="mt-3 flex gap-1">
          <div className="w-4 h-4 rounded-full bg-primary"></div>
          <div className="w-4 h-4 rounded-full bg-secondary"></div>
          <div className="w-4 h-4 rounded-full bg-accent"></div>
          <div className="w-4 h-4 rounded-full bg-muted"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemePreview;
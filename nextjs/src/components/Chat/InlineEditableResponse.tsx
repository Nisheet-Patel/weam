import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MarkOutPut } from './MartOutput';
import { Button } from '@/components/ui/button';
import TextAreaBox from '@/widgets/TextAreaBox';

interface EditableSegment {
  id: string;
  content: string;
  isEditing: boolean;
  originalContent: string;
}

interface InlineEditableResponseProps {
  response: string;
  onSave?: (updatedResponse: string) => void;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
}

const InlineEditableResponse: React.FC<InlineEditableResponseProps> = ({
  response,
  onSave,
  onCancel,
  className = '',
  disabled = false
}) => {
  const [segments, setSegments] = useState<EditableSegment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Split response into editable segments (paragraphs)
  const splitIntoSegments = useCallback((text: string): EditableSegment[] => {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    return paragraphs.map((content, index) => ({
      id: `segment-${index}`,
      content: content.trim(),
      isEditing: false,
      originalContent: content.trim()
    }));
  }, []);

  // Initialize segments when response changes
  useEffect(() => {
    const newSegments = splitIntoSegments(response);
    setSegments(newSegments);
  }, [response, splitIntoSegments]);

  // Handle segment click to start editing
  const handleSegmentClick = (segmentId: string) => {
    if (disabled) return;
    
    setSegments(prev => 
      prev.map(segment => ({
        ...segment,
        isEditing: segment.id === segmentId
      }))
    );
    setIsEditing(true);
  };

  // Handle save for a specific segment
  const handleSegmentSave = (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    const updatedSegments = segments.map(s => 
      s.id === segmentId 
        ? { ...s, isEditing: false, originalContent: s.content }
        : s
    );
    
    setSegments(updatedSegments);
    setIsEditing(false);

    // Call onSave with the updated full response
    if (onSave) {
      const updatedResponse = updatedSegments.map(s => s.content).join('\n\n');
      onSave(updatedResponse);
    }
  };

  // Handle cancel for a specific segment
  const handleSegmentCancel = (segmentId: string) => {
    setSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, isEditing: false, content: segment.originalContent }
          : segment
      )
    );
    setIsEditing(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  // Handle content change for a segment
  const handleSegmentChange = (segmentId: string, newContent: string) => {
    setSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { ...segment, content: newContent }
          : segment
      )
    );
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [segments]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent, segmentId: string) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSegmentSave(segmentId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleSegmentCancel(segmentId);
    }
  };

  // Render individual segment
  const renderSegment = (segment: EditableSegment) => {
    if (segment.isEditing) {
      return (
        <div key={segment.id} className="relative group">
          <div className="flex items-start gap-2">
            <TextAreaBox
              message={segment.content}
              handleChange={(e) => handleSegmentChange(segment.id, e.target.value)}
              handleKeyDown={(e) => handleKeyDown(e, segment.id)}
              isDisable={false}
              className="min-h-[60px] resize-none border-2 border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 rounded-lg p-3 text-sm leading-relaxed"
              placeholder="Edit your response..."
              ref={textareaRef}
            />
            <div className="flex flex-col gap-1 mt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSegmentSave(segment.id)}
                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                title="Save (Cmd+Enter)"
              >
                <span className="h-4 w-4">✓</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSegmentCancel(segment.id)}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                title="Cancel (Esc)"
              >
                <span className="h-4 w-4">✕</span>
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press Cmd+Enter to save, Esc to cancel
          </div>
        </div>
      );
    }

    return (
      <div
        key={segment.id}
        onClick={() => handleSegmentClick(segment.id)}
        className={`
          relative group cursor-pointer rounded-lg p-3 transition-all duration-200
          hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200
          ${disabled ? 'cursor-default hover:bg-transparent hover:shadow-none hover:border-transparent' : ''}
        `}
      >
        <div className="prose prose-sm max-w-none">
          {MarkOutPut(segment.content)}
        </div>
        
        {!disabled && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white shadow-md rounded-md p-1 border">
              <span className="h-4 w-4 text-gray-500">✏️</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`inline-editable-response ${className}`}>
      {segments.length === 0 ? (
        <div className="text-gray-500 italic">No content to display</div>
      ) : (
        <div className="space-y-2">
          {segments.map(renderSegment)}
        </div>
      )}
      
      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            💡 Tip: You can edit any part of the response by clicking on it. 
            Use Cmd+Enter to save or Esc to cancel.
          </p>
        </div>
      )}
    </div>
  );
};

export default InlineEditableResponse; 
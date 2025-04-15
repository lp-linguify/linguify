// src/app/(dashboard)/(apps)/flashcard/_components/ImportExcelModal.tsx
'use client';
import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  HelpCircle,
  Upload,
  FileSpreadsheet,
  Check,
  X,
  ArrowRight,
  ArrowLeftIcon,
  ArrowRightIcon,
  AlertTriangle,
  File,
  Save,
  Home
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { cn } from "@/core/utils/utils";
import { useTranslation } from "@/core/i18n/useTranslations";
import { ImportExcelModalProps, ColumnMapping } from "@/addons/flashcard/types";

export default function ImportExcelModal({
  deckId,
  isOpen,
  onClose,
  onImportSuccess,
}: ImportExcelModalProps) {
  const { t } = useTranslation();
  // States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasHeader, setHasHeader] = useState(true);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'import'>('upload');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]); // To store original data
  const [totalRows, setTotalRows] = useState(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ frontColumn: '', backColumn: '' });
  const [fileType, setFileType] = useState<'xlsx' | 'csv' | 'unknown'>('unknown');
  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [lastValidStep, setLastValidStep] = useState<'upload' | 'map' | 'preview' | 'import'>('upload');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset on each modal opening
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Monitor unsaved changes
  useEffect(() => {
    if (step !== 'upload' && step !== 'import') {
      setHasUnsavedChanges(true);
    } else if (step === 'import') {
      setHasUnsavedChanges(false);
    }
  }, [step, columnMapping, previewData]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    processFile(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File | null) => {
    if (file) {
      setError(null);
      // Determine file type
      let type: 'xlsx' | 'csv' | 'unknown' = 'unknown';
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        type = 'xlsx';
      } else if (file.name.endsWith('.csv')) {
        type = 'csv';
      } else {
        toast({
          title: t('dashboard.flashcards.excelImport.invalidFormat'),
          description: t('dashboard.flashcards.excelImport.invalidFormatDesc'),
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setFileType(type);
      setStep('upload');
      resetState();
      setHasUnsavedChanges(true);
    }
  };

  const analyzeFile = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      setIsUploading(true);
      setProgress(30);

      const result = await revisionApi.flashcards.importFromExcel(deckId, selectedFile, {
        hasHeader,
        previewOnly: true
      });

      setProgress(100);

      // Extract columns from the preview data if available
      const extractedColumns = result.preview && result.preview.length > 0 ?
        Object.keys(result.preview[0]) : [];

      if (extractedColumns.length > 0) {
        setColumns(extractedColumns);

        // Set default mappings for the first two columns
        setColumnMapping({
          frontColumn: extractedColumns[0] || '',
          backColumn: extractedColumns.length > 1 ? extractedColumns[1] : '',
        });

        setPreviewData(result.preview || []);
        setOriginalData(result.preview || []); // Save original data
        setTotalRows(result.preview?.length || 0);

        // Move to mapping step
        setStep('map');
        setLastValidStep('map');
      } else {
        setError(t('dashboard.flashcards.excelImport.noColumnsDesc'));
        toast({
          title: t('dashboard.flashcards.excelImport.invalidFileStructure'),
          description: t('dashboard.flashcards.excelImport.noColumnsDesc'),
          variant: "destructive",
        });
      }

    } catch (error: any) {
      setError(error.message || t('dashboard.flashcards.excelImport.analysisError'));
      toast({
        title: t('dashboard.flashcards.excelImport.analysisError'),
        description: error.message || t('dashboard.flashcards.excelImport.analysisError'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const generatePreview = () => {
    if (originalData.length === 0) return;

    // Validate data with selected mapping
    const invalid: number[] = [];

    // Create transformed data with mapping
    const transformedData = originalData.map((row, index) => {
      const frontText = row[columnMapping.frontColumn]?.toString().trim() || '';
      const backText = row[columnMapping.backColumn]?.toString().trim() || '';

      if (!frontText || !backText) {
        invalid.push(index);
      }

      return {
        front_text: frontText,
        back_text: backText,
      };
    });

    setPreviewData(transformedData);
    setInvalidRows(invalid);
    setStep('preview');
    setLastValidStep('preview');
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      setIsUploading(true);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Do the actual import
      const result = await revisionApi.flashcards.importFromExcel(deckId, selectedFile, {
        hasHeader,
        previewOnly: false,
        frontColumn: columnMapping.frontColumn,
        backColumn: columnMapping.backColumn
      } as any);

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: t('dashboard.flashcards.excelImport.importSuccess'),
        description: t('dashboard.flashcards.excelImport.importCreated', {
          created: String(result.created),
          failed: String(result.failed)
        }),
      });

      // Notify parent component
      onImportSuccess();

      // Update step
      setStep('import');
      setLastValidStep('import');
      setHasUnsavedChanges(false);

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);

    } catch (error: any) {
      setError(error.message || t('dashboard.flashcards.excelImport.analysisError'));
      toast({
        title: t('dashboard.flashcards.excelImport.errorTitle'),
        description: error.message || t('dashboard.flashcards.excelImport.analysisError'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoBack = () => {
    if (step === 'preview') {
      // Go back to mapping step
      setStep('map');
    } else if (step === 'map') {
      // Ask for confirmation before returning to file selection step
      // as this would lose analysis data
      setShowCancelDialog(true);
    }
  };

  const confirmGoBack = () => {
    setStep('upload');
    setShowCancelDialog(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const resetState = () => {
    setPreviewData([]);
    setOriginalData([]);
    setColumns([]);
    setColumnMapping({ frontColumn: '', backColumn: '' });
    setTotalRows(0);
    setInvalidRows([]);
    setHasUnsavedChanges(false);
    setError(null);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setStep('upload');
    setLastValidStep('upload');
    resetState();
    setHasUnsavedChanges(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2 overflow-x-auto py-2 w-full">
        <StepBadge
          number={1}
          label={t('dashboard.flashcards.excelImport.fileLabel')}
          active={step === 'upload'}
          completed={lastValidStep !== 'upload'}
          onClick={() => {
            if (lastValidStep !== 'upload' && hasUnsavedChanges) {
              setShowCancelDialog(true);
            }
          }}
        />
        <ArrowRightIcon size={12} className="text-white/70" />
        <StepBadge
          number={2}
          label={t('dashboard.flashcards.excelImport.mappingLabel')}
          active={step === 'map'}
          completed={lastValidStep === 'preview' || lastValidStep === 'import'}
          onClick={() => {
            if (lastValidStep === 'preview' || lastValidStep === 'import') {
              setStep('map');
            }
          }}
        />
        <ArrowRightIcon size={12} className="text-white/70" />
        <StepBadge
          number={3}
          label={t('dashboard.flashcards.excelImport.previewLabel')}
          active={step === 'preview'}
          completed={lastValidStep === 'import'}
          onClick={() => {
            if (lastValidStep === 'import') {
              setStep('preview');
            }
          }}
        />
        <ArrowRightIcon size={12} className="text-white/70" />
        <StepBadge
          number={4}
          label={t('dashboard.flashcards.excelImport.importLabel')}
          active={step === 'import'}
          completed={false}
        />
      </div>
    </div>
  );

  // Component for step badges
  const StepBadge = ({
    number,
    label,
    active,
    completed,
    onClick
  }: {
    number: number;
    label: string;
    active: boolean;
    completed: boolean;
    onClick?: () => void;
  }) => (
    <div
      className={cn(
        "flex items-center space-x-1 px-3 py-1 rounded-full transition-colors",
        active ? "bg-white text-indigo-800 shadow-lg" :
          completed ? "bg-white/20 text-white hover:bg-white/30 cursor-pointer" :
            "bg-white/10 text-white/60",
        onClick && completed ? "cursor-pointer" : ""
      )}
      onClick={completed ? onClick : undefined}
    >
      <span className={cn(
        "flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium",
        active ? "bg-indigo-600 text-white" :
          completed ? "bg-white/80 text-indigo-800" :
            "bg-white/20 text-white/80"
      )}>
        {completed ? <Check className="h-3 w-3" /> : number}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{t('dashboard.flashcards.excelImport.errorTitle')}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Calculate the number of cards that will be imported
  const validCardsCount = previewData.length - invalidRows.length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
        <div className="w-[95%] max-w-4xl bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 p-1 rounded-xl shadow-2xl">
          <Card className="w-full bg-white/95 backdrop-blur-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">
                    {getStepTitle()}
                  </CardTitle>
                  <CardDescription>
                    {step === 'upload' && t('dashboard.flashcards.excelImport.descUpload')}
                    {step === 'map' && t('dashboard.flashcards.excelImport.descMap')}
                    {step === 'preview' && t('dashboard.flashcards.excelImport.descPreview')}
                    {step === 'import' && t('dashboard.flashcards.excelImport.descImport')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{t('dashboard.flashcards.excelImport.tooltipHelp')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Background gradient for steps */}
              <div className="relative p-2 mt-4 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400">
                {renderStepIndicator()}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Display error message if exists */}
              {error && <ErrorMessage message={error} />}

              {/* Step 1: File Selection */}
              {step === 'upload' && (
                <div className="space-y-6">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors",
                      dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300",
                      selectedFile ? "bg-green-50 border-green-200" : ""
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full flex items-center justify-center mb-3 text-white">
                          <FileSpreadsheet className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('dashboard.flashcards.excelImport.fileStats', {
                            size: (selectedFile.size / 1024).toFixed(1),
                            type: fileType === 'xlsx'
                              ? t('dashboard.flashcards.excelImport.excelType')
                              : fileType === 'csv'
                                ? t('dashboard.flashcards.excelImport.csvType')
                                : t('dashboard.flashcards.excelImport.supportedType')
                          })}
                        </p>
                        <div className="flex mt-4 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                            disabled={isUploading}
                            className="text-sm"
                          >
                            <X className="h-3 w-3 mr-1" />
                            {t('dashboard.flashcards.excelImport.changeFile')}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isUploading}
                            onClick={analyzeFile}
                            className="text-sm bg-gradient-to-r from-indigo-600 to-purple-500 text-white"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                {t('dashboard.flashcards.excelImport.analyzing')}
                              </>
                            ) : (
                              <>
                                {t('dashboard.flashcards.excelImport.analyzeBtn')}
                                <ArrowRight className="ml-2 h-3 w-3" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                          <Upload className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          {dragActive
                            ? t('dashboard.flashcards.excelImport.dragActive')
                            : t('dashboard.flashcards.excelImport.dragInactive')}
                        </h3>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white"
                        >
                          <File className="mr-2 h-4 w-4" />
                          {t('dashboard.flashcards.excelImport.selectFile')}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                        <p className="text-sm text-gray-500 mt-4">
                          {t('dashboard.flashcards.excelImport.supportedFormats')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="has-header"
                      checked={hasHeader}
                      onCheckedChange={(checked) => setHasHeader(checked as boolean)}
                    />
                    <div>
                      <Label htmlFor="has-header" className="font-medium">
                        {t('dashboard.flashcards.excelImport.hasHeaderLabel')}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t('dashboard.flashcards.excelImport.hasHeaderDesc')}
                      </p>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="border-t pt-4 mt-6">
                      <Button
                        onClick={analyzeFile}
                        disabled={isUploading || !selectedFile}
                        className="w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('dashboard.flashcards.excelImport.analyzing')}
                          </>
                        ) : (
                          <>
                            {t('dashboard.flashcards.excelImport.analyzeContinue')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Column Mapping */}
              {step === 'map' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="front-column" className="text-base font-medium mb-2 block">
                        {t('dashboard.flashcards.excelImport.frontColumnLabel')}
                      </Label>
                      <Select
                        value={columnMapping.frontColumn}
                        onValueChange={(value) => setColumnMapping({ ...columnMapping, frontColumn: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('dashboard.flashcards.excelImport.selectColumn')} />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('dashboard.flashcards.excelImport.frontColumnDesc')}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="back-column" className="text-base font-medium mb-2 block">
                        {t('dashboard.flashcards.excelImport.backColumnLabel')}
                      </Label>
                      <Select
                        value={columnMapping.backColumn}
                        onValueChange={(value) => setColumnMapping({ ...columnMapping, backColumn: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('dashboard.flashcards.excelImport.selectColumn')} />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('dashboard.flashcards.excelImport.backColumnDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-md overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          {columns.map((col) => (
                            <TableHead key={col}>
                              {col}
                              {col === columnMapping.frontColumn && (
                                <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-800 border-indigo-300">
                                  {t('dashboard.flashcards.excelImport.frontBadge')}
                                </Badge>
                              )}
                              {col === columnMapping.backColumn && (
                                <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 border-purple-300">
                                  {t('dashboard.flashcards.excelImport.backBadge')}
                                </Badge>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {originalData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            {columns.map((col) => (
                              <TableCell key={col} className={cn(
                                col === columnMapping.frontColumn ? 'bg-indigo-50' :
                                  col === columnMapping.backColumn ? 'bg-purple-50' : ''
                              )}>
                                {String(row[col] || '')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Help message for mapping */}
                  <div className="flex p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <div className="mr-3 flex-shrink-0">
                      <HelpCircle className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-indigo-800">
                        {t('dashboard.flashcards.excelImport.howMappingWorks')}
                      </h4>
                      <p className="text-sm mt-1 text-indigo-700">
                        {t('dashboard.flashcards.excelImport.mappingDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Button to generate preview */}
                  <div className="border-t pt-4 mt-4">
                    <Button
                      onClick={generatePreview}
                      disabled={isUploading || !columnMapping.frontColumn || !columnMapping.backColumn || columnMapping.frontColumn === columnMapping.backColumn}
                      className="w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('dashboard.flashcards.excelImport.generating')}
                        </>
                      ) : (
                        <>
                          {t('dashboard.flashcards.excelImport.generatePreview')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {columnMapping.frontColumn === columnMapping.backColumn && columnMapping.frontColumn !== '' && (
                      <p className="text-sm text-red-500 mt-2">
                        {t('dashboard.flashcards.excelImport.columnsMustDiffer')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Data Preview */}
              {step === 'preview' && (
                <div className="space-y-6">
                  {/* Summary banner highlighting the number of cards */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 flex-shrink-0 bg-white/20 p-2 rounded-full">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {t('dashboard.flashcards.excelImport.cardsReadyToImport', { count: String(validCardsCount) })}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {t('dashboard.flashcards.excelImport.totalRowsStats', {
                              total: String(totalRows),
                              invalid: String(invalidRows.length)
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-white text-indigo-700 px-3 py-1.5">
                        {t('dashboard.flashcards.excelImport.previewBadge')}
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-md overflow-auto max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>{t('dashboard.flashcards.excelImport.frontBadge')}</TableHead>
                          <TableHead>{t('dashboard.flashcards.excelImport.backBadge')}</TableHead>
                          <TableHead className="w-16">{t('dashboard.flashcards.excelImport.statusColumn')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index} className={invalidRows.includes(index) ? "bg-red-50" : ""}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{row.front_text}</TableCell>
                            <TableCell>{row.back_text}</TableCell>
                            <TableCell>
                              {invalidRows.includes(index) ? (
                                <Badge variant="destructive" className="flex items-center">
                                  <X className="h-3 w-3 mr-1" />
                                  {t('dashboard.flashcards.excelImport.invalidBadge')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 flex items-center text-green-700 border-green-300">
                                  <Check className="h-3 w-3 mr-1" />
                                  {t('dashboard.flashcards.excelImport.validBadge')}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Warning message for invalid rows */}
                  {invalidRows.length > 0 && (
                    <div className="flex p-4 rounded-lg bg-red-50">
                      <div className="mr-3 flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          {t('dashboard.flashcards.excelImport.invalidRowsAlert', { count: String(invalidRows.length) })}
                        </h4>
                        <p className="text-sm mt-1 text-red-700">
                          {t('dashboard.flashcards.excelImport.invalidRowsDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Import summary */}
                  <div className="flex p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <div className="mr-3 flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-indigo-800">
                        {t('dashboard.flashcards.excelImport.readyToImport', { count: String(validCardsCount) })}
                      </h4>
                      <p className="text-sm mt-1 text-indigo-700">
                        {t('dashboard.flashcards.excelImport.readyToImportDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Import button */}
                  <div className="border-t pt-4 mt-4">
                    <Button
                      onClick={handleImport}
                      disabled={isUploading || previewData.length === 0 || validCardsCount === 0}
                      className="w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('dashboard.flashcards.excelImport.importing')}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {t('dashboard.flashcards.excelImport.importBtn', { count: String(validCardsCount) })}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Import completed */}
              {step === 'import' && (
                <div className="text-center space-y-6 py-8">
                  <div className="mx-auto bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-full p-6 w-24 h-24 flex items-center justify-center">
                    <Check className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
                    {t('dashboard.flashcards.excelImport.successTitle')}
                  </h3>
                  <p className="text-gray-600">
                    {t('dashboard.flashcards.excelImport.successDesc')}
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={onClose}
                      className="px-8 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      {t('dashboard.flashcards.excelImport.finishBtn')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-2 mt-4">
                  <Progress
                    value={progress}
                    className="h-2 bg-gray-200"
                  />
                  <p className="text-sm text-gray-500 text-center">
                    {progress === 100 ? 'Completed!' : getProgressLabel()}
                  </p>
                </div>
              )}
            </CardContent>

            {/* Footer with navigation buttons */}
            {step !== 'import' && (
              <CardFooter className="flex justify-between border-t pt-4">
                <div>
                  {step !== 'upload' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoBack}
                      disabled={isUploading}
                      className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      {t('dashboard.flashcards.excelImport.backBtn')}
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUploading}
                    className="border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                  >
                    {t('dashboard.flashcards.excelImport.cancelBtn')}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation dialog for cancellation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-none shadow-xl bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 p-1 rounded-2xl">
          <div className="bg-white rounded-xl overflow-hidden">
            <DialogHeader className="pt-6 px-6">
              <DialogTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
                {t('dashboard.flashcards.excelImport.abandonTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('dashboard.flashcards.excelImport.abandonDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 p-6">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {t('dashboard.flashcards.excelImport.continueImportingBtn')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (step === 'map' && lastValidStep === 'map') {
                    confirmGoBack();
                  } else {
                    onClose();
                    resetForm();
                  }
                }}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {t('dashboard.flashcards.excelImport.abandonBtn')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  // Utility functions
  function getStepTitle() {
    switch (step) {
      case 'upload': return t('dashboard.flashcards.excelImport.title');
      case 'map': return t('dashboard.flashcards.excelImport.mapColumns');
      case 'preview': return t('dashboard.flashcards.excelImport.previewData');
      case 'import': return t('dashboard.flashcards.excelImport.importSuccessful');
      default: return t('dashboard.flashcards.excelImport.title');
    }
  }

  function getProgressLabel() {
    switch (step) {
      case 'upload': return t('dashboard.flashcards.excelImport.analyzingFileProgress');
      case 'map': return t('dashboard.flashcards.excelImport.processingDataProgress');
      case 'preview': return t('dashboard.flashcards.excelImport.preparingPreviewProgress');
      case 'import': return t('dashboard.flashcards.excelImport.importingProgress');
      default: return t('dashboard.flashcards.excelImport.processingLabel');
    }
  }
}
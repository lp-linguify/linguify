// src/app/(dashboard)/(apps)/flashcard/_components/EditCardModal.tsx
/**
 * EditCardModal Component
 * This component is used to edit a flashcard's front and back text.
 * It provides a form with two tabs: Edit and Preview.
 * The Edit tab allows the user to modify the front and back text of the card,
 * while the Preview tab shows a preview of the card with the option to flip it.
 * The component also includes a reset button to revert changes and a save button to apply the modifications.
 * It uses the `useToast` hook to display success and error messages during the save process.
 * The component is styled using Tailwind CSS and includes icons from the `lucide-react` library.
 */
import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, X, RotateCw, ArrowLeftRight } from "lucide-react";
import type { EditCardModalProps } from "@/addons/flashcard/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/core/i18n/useTranslations";

export default function EditCardModal({ card, isOpen, onClose, onSave }: EditCardModalProps) {
    const [formData, setFormData] = useState({
        front_text: card.front_text,
        back_text: card.back_text
    });
    const [originalData, setOriginalData] = useState({
        front_text: card.front_text,
        back_text: card.back_text
    });
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("edit");
    const [previewFlipped, setPreviewFlipped] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();

    // Reset form when card changes
    useEffect(() => {
        setFormData({
            front_text: card.front_text,
            back_text: card.back_text
        });
        setOriginalData({
            front_text: card.front_text,
            back_text: card.back_text
        });
    }, [card]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onSave(formData);
            toast({
                title: t('dashboard.flashcards.successTitle'),
                description: t('dashboard.flashcards.updateSuccess')
            });
            onClose();
        } catch (err) {
            toast({
                title: t('dashboard.flashcards.errorTitle'),
                description: t('dashboard.flashcards.updateError'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData(originalData);
        toast({
            title: t('dashboard.flashcards.resetTitle'),
            description: t('dashboard.flashcards.resetDescription')
        });
    };

    const handleFlipTexts = () => {
        setFormData({
            front_text: formData.back_text,
            back_text: formData.front_text
        });
        toast({
            title: t('dashboard.flashcards.flippedTitle'),
            description: t('dashboard.flashcards.flippedDescription')
        });
    };

    // Calculate if form has been modified
    const isModified =
        formData.front_text !== originalData.front_text ||
        formData.back_text !== originalData.back_text;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[90%] max-w-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('dashboard.flashcards.editCard')}</CardTitle>
                        <CardDescription>
                            {t('dashboard.flashcards.editCardDescription')}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t('dashboard.flashcards.close')}</span>
                    </Button>
                </CardHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="px-6">
                        <TabsList className="w-full">
                            <TabsTrigger value="edit" className="flex-1">{t('dashboard.flashcards.edit')}</TabsTrigger>
                            <TabsTrigger value="preview" className="flex-1">{t('dashboard.flashcards.preview')}</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="edit">
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4 pt-2">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={!isModified || isLoading}
                                    >
                                        <RotateCw className="mr-2 h-4 w-4" />
                                        {t('dashboard.flashcards.reset')}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleFlipTexts}
                                        disabled={isLoading}
                                    >
                                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                                        {t('dashboard.flashcards.flip')}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="front_text">{t('dashboard.flashcards.front')}</Label>
                                    <Textarea
                                        id="front_text"
                                        value={formData.front_text}
                                        onChange={(e) => handleChange('front_text', e.target.value)}
                                        placeholder={t('dashboard.flashcards.frontText')}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="back_text">{t('dashboard.flashcards.back')}</Label>
                                    <Textarea
                                        id="back_text"
                                        value={formData.back_text}
                                        onChange={(e) => handleChange('back_text', e.target.value)}
                                        placeholder={t('dashboard.flashcards.backText')}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isLoading}
                                >
                                    {t('dashboard.flashcards.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading ||
                                        !formData.front_text.trim() ||
                                        !formData.back_text.trim() ||
                                        !isModified}
                                    className="bg-brand-purple hover:bg-brand-purple-dark"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('dashboard.flashcards.saving')}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {t('dashboard.flashcards.saveChanges')}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="preview">
                        <CardContent className="space-y-4 pt-2">
                            <div className="flex justify-center mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewFlipped(prev => !prev)}
                                >
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    {t('dashboard.flashcards.flipCard')}
                                </Button>
                            </div>
                            <div
                                className="flex items-center justify-center p-8 border rounded-lg min-h-[250px] bg-white shadow-sm cursor-pointer transition-all duration-300"
                                onClick={() => setPreviewFlipped(prev => !prev)}
                            >
                                <div className="text-center">
                                    <h3 className="text-sm text-gray-500 uppercase mb-2">
                                        {previewFlipped ? t('dashboard.flashcards.backSide') : t('dashboard.flashcards.frontSide')}
                                    </h3>
                                    <p className="text-2xl font-medium">
                                        {previewFlipped ? formData.back_text : formData.front_text}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-4">{t('dashboard.flashcards.clickToFlip')}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setActiveTab("edit")}
                            >
                                {t('dashboard.flashcards.backToEdit')}
                            </Button>
                            <Button
                                onClick={onClose}
                            >
                                {t('dashboard.flashcards.close')}
                            </Button>
                        </CardFooter>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
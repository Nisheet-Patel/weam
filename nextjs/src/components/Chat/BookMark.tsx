'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import BookMarkIcon from '@/icons/Bookmark';
import SearchIcon from '@/icons/Search';
import useFavorite from '@/hooks/users/useFavorite';
import { capitalizeFirstLetter } from '@/utils/common';
import ThreeDotLoader from '../Loader/ThreeDotLoader';
import { AGENT_ALREADY_SELECTED_ERROR_MESSAGE, FILE_ALREADY_SELECTED_ERROR_MESSAGE, GPTTypes } from '@/utils/constant';
import { GPTTypesOptions, SelectedContextData, UploadedFileType } from '@/types/chat';
import Toast from '@/utils/toast';

type BookmarkDialogProps = {
    onSelect: (type: GPTTypesOptions, data: SelectedContextData) => void;
    isWebSearchActive: boolean;
    selectedAttachment: UploadedFileType[];
};

const BookmarkDialog = React.memo(({ onSelect, isWebSearchActive, selectedAttachment }: BookmarkDialogProps) => {

    const { getFavoriteList, favorites, loading: favoriteLoading } = useFavorite();
    const [searchValue, setSearchValue] = useState('');
    const [bookMarkOpen, setBookMarkOpen] = useState(false);
    
    const handleOpenChange = useCallback((open: boolean) => {
        if (open) {
            getFavoriteList();
            setBookMarkOpen(true);
        }
    }, [getFavoriteList]);

    useEffect(() => {
        if (bookMarkOpen) {
            const timer: NodeJS.Timeout = setTimeout(() => {
                getFavoriteList(searchValue);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchValue]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }, []);   
    
    const highlightSelectedRecord = useCallback(() => {
        let res = false;
        
        // if(data?.type === GPTTypes.Docs){
        //     res = uploadedFileIds?.includes(data?.details?.fileId) ? true : false;
        // } else if(data?.type === GPTTypes.CustomGPT){
        //     res = (currSelectedBot?._id == data?.details?._id) ? true : false;
        // } else if(data?.type === GPTTypes.Prompts){
        //     res = uploadedFileIds?.includes(data?.details?.prompt?._id) ? true : false;
        // }
        
        return res;
    }, []);    

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent Enter key from triggering the dialog
                    }
                }}
            >
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger disabled={isWebSearchActive}>
                            <div className={`chat-btn cursor-pointer transition ease-in-out duration-200 hover:bg-b11 rounded-md w-auto h-8 flex items-center px-[5px] ${
                                            isWebSearchActive ? 'opacity-50 pointer-events-none' : ''
                                            }`}
                            >
                                <BookMarkIcon width={16} height={15} className='fill-b5 w-auto h-[15px]'/>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-font-14">
                            {isWebSearchActive
                                ? "This feature is unavailable in web search"
                                : "Select from Favorite Prompts, Agents, or Docs"}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="md:max-w-[550px] max-w-[calc(100%-30px)] py-7 border-none">
                <DialogHeader className="rounded-t-10 px-[30px] pb-5 border-b">
                    <DialogTitle className="font-semibold flex items-center">
                        Your Favorite Prompts, Agents, and Docs
                    </DialogTitle>
                </DialogHeader>
                
                <div className="dialog-body flex flex-col flex-1 relative h-full px-5 overflow-y-auto max-md:max-h-[calc(100vh-250px)]">
                    <div className="md:min-w-80 relative mt-5 mb-2">
                        <input
                            type="text"
                            className="default-form-input default-form-input-md !border-b10 focus:!border-b2 !pl-10"
                            id="searchDocs"
                            placeholder="Search"
                            onChange={handleInputChange}
                        />
                        <span className="inline-block absolute left-[15px] top-1/2 -translate-y-1/2 [&>svg]:fill-b7">
                            <SearchIcon className="w-4 h-[17px] fill-b7" />
                        </span>
                    </div>
                    <div className="h-full w-full md:max-h-[40dvh] overflow-y-auto px-2">
                        {favoriteLoading ? <ThreeDotLoader className='h-auto justify-center w-6 mx-auto mt-3' /> : 
                        favorites.length > 0 ?
                            favorites.map((favorite) => (
                                <DialogClose asChild key={`favorite-${favorite.type}-${favorite.itemId}`}>
                                    <div 
                                        onClick={() => {
                                            if (selectedAttachment.length) {
                                                const isSelected = selectedAttachment.some((file) => file._id === favorite.details._id);
                                                if (isSelected) {
                                                    favorite.type === GPTTypes.CustomGPT 
                                                        ? Toast(AGENT_ALREADY_SELECTED_ERROR_MESSAGE, 'error')
                                                        : Toast(FILE_ALREADY_SELECTED_ERROR_MESSAGE, 'error')
                                                    return;
                                                }
                                            }
                                            onSelect(
                                                favorite.type,
                                                {
                                                    ...favorite?.details,
                                                    isremove: false
                                                } 
                                            );
                                        }}
                                        className={`border-b p-3 text-font-14 hover:bg-b11 cursor-pointer ${highlightSelectedRecord(favorite)
                                                    ? 'bg-gray-100'
                                                    : ''
                                        } `}
                                    >
                                        {favorite.details.title} <span className='text-b7'>- {capitalizeFirstLetter(favorite.type === GPTTypes.CustomGPT ? 'Agent' : favorite.type)}</span>
                                    </div>
                                </DialogClose>
                            )) :
                            <div className="w-full max-w-[740px] text-center mx-auto py-8 text-b2 border-[2px] rounded-lg border-b-[5px] px-3 mt-5 col-span-3">
                                <p className="text-font-14">No favorites found</p>
                            </div>
                        }
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

export default BookmarkDialog;
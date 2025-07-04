'use client';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UpLongArrow from '@/icons/UpLongArrow';
import Toast from '@/utils/toast';
import { useDispatch, useSelector } from 'react-redux';
import { setIsWebSearchActive, setSelectedAIModal } from '@/lib/slices/aimodel/assignmodelslice';
import useAssignModalList from '@/hooks/aiModal/useAssignModalList';
import {
    decodedObjectId,
    encodedObjectId,
    generateObjectId,
    persistBrainData,
    retrieveBrainData,
} from '@/utils/helper';
import {
    AI_MODAL_NAME,
    AI_MODEL_CODE,
    API_KEY_MESSAGE,
    API_TYPE_OPTIONS,
    GENERAL_BRAIN_TITLE,
} from '@/utils/constant';
import {
    setChatAccessAction,
    setCreditInfoAction,
    setInitialMessageAction,
} from '@/lib/slices/chat/chatSlice';
import { getCurrentUser } from '@/utils/handleAuth';
import UploadFileInput, { getResponseModel } from './UploadFileInput';
import { RootState } from '@/lib/store';
import { setChatMessageAction, setUploadDataAction } from '@/lib/slices/aimodel/conversation';
import usePrompt from '@/hooks/prompt/usePrompt';
import useMediaUpload from '@/hooks/common/useMediaUpload';
import PromptEnhance from './PromptEnhance';
import BookmarkDialog from './BookMark';
import VoiceChat from './VoiceChat';
import {
    ProAgentDataType,
} from '@/types/chat';
import AttachMentToolTip from './AttachMentToolTip';
import WebSearchToolTip from './WebSearchToolTip';
import ThunderBoltDialog from '../Shared/ThunderBoltDialog';
import { AiModalType } from '@/types/aimodels';
import { SubscriptionActionStatusType } from '@/types/subscription';
import TextAreaBox from '@/widgets/TextAreaBox';
import { ProAgentCode } from '@/types/common';
import useConversationHelper from '@/hooks/conversation/useConversationHelper'
import useConversation from '@/hooks/conversation/useConversation';
import { useThunderBoltPopup } from '@/hooks/conversation/useThunderBoltPopup';
import ChatInputFileLoader from '@/components/Loader/ChatInputFileLoader';
import { setSelectedBrain } from '@/lib/slices/brain/brainlist';

const defaultContext = {
    type: null,
    prompt_id: undefined,
    custom_gpt_id: undefined,
    doc_id: undefined,
    textDisable: false,
    attachDisable: false,
    title: undefined,
};

type TextAreaSubmitButtonProps = {
    disabled: boolean;
    handleSubmit: () => void;
};

type TextAreaFileInputProps = {
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    multiple: boolean;
};

export const TextAreaSubmitButton = ({
    disabled,
    handleSubmit,
}: TextAreaSubmitButtonProps) => {
    return (
        <button
            className={`chat-submit ml-2 group bg-b2 w-[32px] z-10 h-[32px] flex items-center justify-center rounded-full transition-colors ${
                disabled ? 'disabled:bg-b12' : ''
            }`}
            disabled={disabled}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                handleSubmit();
            }}
        >
            <UpLongArrow
                width="15"
                height="19"
                className="fill-b15 group-disabled:fill-b7"
            />
        </button>
    );
};

export const TextAreaFileInput = ({ fileInputRef, handleFileChange, multiple }: TextAreaFileInputProps) => {
    return (
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple={multiple}
        />
    );
};

type ChatInputProps = {
    aiModals: AiModalType[];
}


const URL_PARAMS_AGENT_CODE = {
    [ProAgentCode.QA_SPECIALISTS]: 'QA',
    [ProAgentCode.SEO_OPTIMISED_ARTICLES]: 'SEO',
    [ProAgentCode.SALES_CALL_ANALYZER]: 'SALES',
    [ProAgentCode.WEB_PROJECT_PROPOSAL]: 'PROJECT',
}

const ChatInput = ({ aiModals }: ChatInputProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [message, setMessage] = useState('');
    const [isDisable, setIsDisable] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedContext, setSelectedContext] = useState(defaultContext);
    const [handlePrompts, setHandlePrompts] = useState([]);
    const [queryId, setQueryId] = useState<string>(''); //enhance prompt id
    const [isNavigating, setIsNavigating] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const dispatch = useDispatch();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };
    const selectedAiModal = useSelector((state: RootState) => state.assignmodel.selectedModal);
    const brains= useSelector((state: RootState) => state.brain.shareList);
    const isWebSearchActive = useSelector((store: RootState) => store.assignmodel.isWebSearchActive);
    const selectedBrain = useSelector((store: RootState) => store.brain.selectedBrain);
    const creditInfoSelector = useSelector((store: RootState) => store.chat.creditInfo);

    const { assignServerActionModal } = useAssignModalList();
    const { getDecodedObjectId } = useConversationHelper();
    const {
        loading,
        setPromptList,
        getTabPromptList,
        paginator,
        setLoading,
        promptList:prompts,
    } = usePrompt();
    const { fileInputRef, fileLoader, handleFileChange, handlePasteFiles } = useMediaUpload({
        selectedAIModal: selectedAiModal,
    });
    const uploadedFile = useSelector(
        (store: RootState) => store.conversation.uploadData
    );

    const { blockProAgentAction } = useConversationHelper();
    const { disabledInput } = useConversation();

    const chatId = useMemo(() => generateObjectId(), []);
    const currentUser = useMemo(() => getCurrentUser(), []);

    const { onSelectMenu } = useThunderBoltPopup({
        selectedContext,
        setSelectedContext,
        selectedAIModal: selectedAiModal,
        uploadedFile
    });

    const handleInitialMessage = async (proAgentData: ProAgentDataType = {}) => {
        if (isNavigating) return; // Prevent multiple navigations
        
        if (!aiModals.length) {
            Toast(API_KEY_MESSAGE, 'error');
            setMessage('');
            return;
        }

        setIsNavigating(true);

        const serializableProAgentData = proAgentData?.code ? { ...proAgentData } : {};

        const payload = {
            message: message.trim(),
            response: '',
            responseModel: uploadedFile.some((file) => file.isCustomGpt) 
                ? uploadedFile.find((file) => file.isCustomGpt)?.responseModel 
                : selectedAiModal?.name,
            media: uploadedFile || [],
            seq: Date.now(),
            promptId: selectedContext?.prompt_id,
            customGptId: selectedContext?.custom_gpt_id,
            answer_thread: {
                count: 0,
                users: [],
            },
            question_thread: {
                count: 0,
                users: [],
            },
            threads: [],
            customGptTitle: selectedContext.title,
            coverImage: selectedContext.gptCoverImage,
            user: currentUser,
            model: selectedAiModal.bot,
            cloneMedia: uploadedFile || [],
            proAgentData: serializableProAgentData,
        };

        // Batch the dispatches to avoid multiple renders
        const batchDispatches = () => {
            dispatch(setInitialMessageAction(payload));
            dispatch(setChatAccessAction(true));
            dispatch(
                setCreditInfoAction({
                    msgCreditLimit: creditInfoSelector?.msgCreditLimit,
                    msgCreditUsed: creditInfoSelector?.msgCreditUsed,
                })
            );
        };

        // Use requestAnimationFrame to batch updates
        requestAnimationFrame(() => {
            batchDispatches();
            assignServerActionModal(aiModals);
            setIsDisable(true);
            setMessage('');
            
            const { code } = serializableProAgentData;
            const agentParam = code ? `&agent=${URL_PARAMS_AGENT_CODE[code]}` : '';
            
            router.push(
                `/chat/${chatId}?b=${searchParams.get('b')}&model=${selectedAiModal.name}${agentParam}`,
                { scroll: false }
            );
            
            // Reset navigation state after a short delay to allow transition
            setTimeout(() => {
                setIsNavigating(false);
            }, 300);
        });
    };

    const handleKeyDown = useCallback(
        async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (message?.trim() !== '' && e.key == 'Enter' && !e.shiftKey && !fileLoader && !blockProAgentAction()) {
                e.preventDefault();
                setQueryId(generateObjectId());
                handleInitialMessage();
            }
        },
        [message]
    );
   
    const removeUploadedFile = () => {
        dispatch(setUploadDataAction([]));
    };

    const isSubmitDisabled = message.trim() === '' || fileLoader || disabledInput.current || blockProAgentAction();

    const handleWebSearchClick = () => {
        dispatch(setIsWebSearchActive(!isWebSearchActive));
    };

    const handleAttachButtonClick = () => {
        fileInputRef.current.click();
    };

    const removeSelectedFile = (index: number) => {
        const updatedFiles = uploadedFile.filter((_, i) => i !== index);
        const isEmptyFiles = updatedFiles.length === 0;
        if (isEmptyFiles) dispatch(setUploadDataAction([]));
        else dispatch(setUploadDataAction(updatedFiles));
        if (fileInputRef.current && isEmptyFiles) {
            fileInputRef.current.value = null; // Reset the file input value
        }
    };

     // Initialize queryId when text changes from empty to non-empty
    useEffect(() => {
        if (message && !queryId) {
            setQueryId(generateObjectId());
        } else if (!message) {
            setQueryId(''); // Reset queryId when text is cleared
        }
    }, [message]);


    useEffect(() => {
        router.prefetch(`/chat/${chatId}`);     
        dispatch(
            setSelectedAIModal(
                aiModals.find(
                    (el: AiModalType) => el.name === AI_MODEL_CODE.DEFAULT_OPENAI_SELECTED
                )
            )
        );
        dispatch(setChatMessageAction(''));
    }, []);

    useEffect(() => {
        if (isWebSearchActive) {
            removeUploadedFile();
            const perplexityAiModal = aiModals.find(
                (modal) =>
                    modal.bot.code === API_TYPE_OPTIONS.PERPLEXITY &&
                    [AI_MODAL_NAME.SONAR, AI_MODAL_NAME.SONAR_REASONING_PRO].includes(
                        modal.name
                    )
            );
            if (perplexityAiModal) {
                if (
                    ![AI_MODAL_NAME.SONAR, AI_MODAL_NAME.SONAR_REASONING_PRO].includes(
                        selectedAiModal.name
                    )
                ) {
                    const payload = {
                        _id: perplexityAiModal._id,
                        bot: perplexityAiModal.bot,
                        company: perplexityAiModal.company,
                        modelType: perplexityAiModal.modelType,
                        name: perplexityAiModal.name,
                        provider: perplexityAiModal?.provider,
                    };
                    dispatch(setSelectedAIModal(payload));
                }
                dispatch(setUploadDataAction([]));
            }
        } else {
            const openAiModal = aiModals.find(
                (modal) =>
                    modal.bot.code === AI_MODEL_CODE.OPEN_AI &&
                    modal.name == AI_MODEL_CODE.DEFAULT_OPENAI_SELECTED
            );
            if (
                openAiModal &&
                [AI_MODAL_NAME.SONAR, AI_MODAL_NAME.SONAR_REASONING_PRO].includes(
                    selectedAiModal.name
                )
            ) {
                const payload = {
                    _id: openAiModal._id,
                    bot: openAiModal.bot,
                    company: openAiModal.company,
                    modelType: openAiModal.modelType,
                    name: openAiModal.name,
                    provider: openAiModal?.provider,
                };
                dispatch(setSelectedAIModal(payload));
            }
        }
        dispatch(setUploadDataAction([]));
    }, [isWebSearchActive]);

    useEffect(() => {
        if (!selectedAiModal?.name) return;
        const modelName = getResponseModel(selectedAiModal.name);
       if(!searchParams.has('b') || !searchParams.has('model')) {
            const generalBrain = brains.find((brain) => brain.title === GENERAL_BRAIN_TITLE);
            history.pushState({}, null, `/?b=${encodedObjectId(generalBrain?._id)}&model=${modelName}`);
        }else {
            const brainId =  decodedObjectId(searchParams.get('b'));
            history.pushState({}, null, `/?b=${encodedObjectId(brainId)}&model=${modelName}`);
        }
    }, [selectedAiModal]);

    useEffect(() => {
        if(prompts?.length > 0){
            if(message){
                const updateIsActive = prompts.map((currPrompt) => {
                    if(currPrompt.content){
                        const summaries = currPrompt?.summaries 
                            ? Object.values(currPrompt.summaries)
                                .map((currSummary:any) => `${currSummary.website} : ${currSummary.summary}`)
                                .join('\n')
                            : '';
                
                        const isContentIncluded = message?.replace(/\s+/g, '')?.includes((currPrompt.content + (summaries ? '\n' + summaries : ''))?.replace(/\s+/g, ''));
                        return {...currPrompt,isActive:isContentIncluded}
                    }

                    return currPrompt
                })

                setHandlePrompts(updateIsActive);
            }else{
                setHandlePrompts(prompts);
            }
        }else{
            setHandlePrompts(prompts)
        }
    }, [prompts, message]);

    // Auto-adjust textarea height based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height to auto
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set new height based on scrollHeight
        }
    }, [message]);

 useEffect(() => { 
        const generalBrain = brains.find((brain) => brain.title === GENERAL_BRAIN_TITLE);
        
        if(!generalBrain){
            const generalBrain = brains[0];
            dispatch(setSelectedBrain(generalBrain));
            persistBrainData(generalBrain);
        }else{
            if(selectedBrain?._id !== generalBrain._id){
                dispatch(setSelectedBrain(generalBrain));
            }
            
            if (!retrieveBrainData()) {
                persistBrainData(generalBrain);
            }
        }

        setSelectedAIModal(aiModals.find((modal) => modal.name === AI_MODEL_CODE.DEFAULT_OPENAI_SELECTED));

    
    }, [searchParams, brains, dispatch]); 

    return (
        <>
        <div className="w-full h-full flex items-center justify-center">
            <div className={`w-full mx-auto px-5 md:max-w-[32rem] lg:max-w-[40rem] xl:max-w-[48.75rem] ${isNavigating ? 'opacity-50' : ''}`}>
                <h2 className='text-center mb-4 font-bold text-font-20'>How Weam can help you today?</h2>
                <div className="flex flex-col text-font-16 mx-auto group overflow-hidden rounded-[12px] [&:has(textarea:focus)]:shadow-[0_2px_6px_rgba(0,0,0,.05)] w-full flex-grow relative border border-b11">
                    <UploadFileInput
                        removeFile={removeSelectedFile}
                        fileData={uploadedFile}
                    />
                    {fileLoader && (<ChatInputFileLoader />)}
                    <TextAreaBox
                        message={message}
                        handleChange={handleChange}
                        handleKeyDown={handleKeyDown}
                        isDisable={isDisable}
                        autoFocus={isWebSearchActive}
                        onPaste={handlePasteFiles}
                        ref={textareaRef}
                    />
                    <div className="flex items-center z-10 px-4 pb-[6px]">
                        <ThunderBoltDialog
                            isWebSearchActive={isWebSearchActive}
                            dialogOpen={dialogOpen}
                            uploadedFile={uploadedFile}
                            setDialogOpen={setDialogOpen}
                            onSelect={onSelectMenu}
                            selectedContext={selectedContext}
                            setText={setMessage}
                            handlePrompts={handlePrompts}
                            setHandlePrompts={setHandlePrompts}
                            getList={getTabPromptList}
                            promptLoader={loading}
                            setPromptLoader={setLoading}
                            paginator={paginator}
                            setPromptList={setPromptList}
                            promptList={prompts}
                            handleSubmitPrompt={handleInitialMessage}
                        />
                        <AttachMentToolTip
                            fileLoader={fileLoader}
                            isWebSearchActive={isWebSearchActive}
                            handleAttachButtonClick={handleAttachButtonClick}
                        />
                        <BookmarkDialog
                            onSelect={onSelectMenu}
                            isWebSearchActive={isWebSearchActive}
                            selectedAttachment={uploadedFile}
                        />
                        <WebSearchToolTip
                            loading={false}
                            isWebSearchActive={isWebSearchActive}
                            handleWebSearchClick={handleWebSearchClick}
                        />
                        <PromptEnhance
                            isWebSearchActive={isWebSearchActive}
                            text={message}
                            setText={setMessage}
                            promptId={selectedContext.prompt_id}
                            queryId={queryId}
                            brainId={getDecodedObjectId()}
                        />
                        <VoiceChat setText={setMessage} text={message} />
                        <TextAreaFileInput
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                            multiple
                        />
                        <TextAreaSubmitButton
                            disabled={isSubmitDisabled || isNavigating}
                            handleSubmit={handleInitialMessage}
                        />
                    </div>                    
                </div>
            </div>
        </div>
        <div className='relative py-2 md:max-w-[30rem] lg:max-w-[38rem] xl:max-w-[45.75rem] max-w-[calc(100%-30px)] w-full mx-auto'>
            <div className='absolute left-0 right-0 mx-auto'>
            </div>
        </div>
        </>
    );
};

export default ChatInput;

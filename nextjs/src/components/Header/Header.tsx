'use client';
import UserModel from './UserModel';
import MemberList from './MemberList';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import routes from '@/utils/routes';
import ChatThreadIcon from '@/icons/ChatThreadIcon';
import PromptIcon from '@/icons/Prompt';
import Customgpt from '@/icons/Customgpt';
import UserImage from '../../../public/user-placeholderlight.jpg';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import useSocket from '@/utils/socket';
import { getCompanyId, getCurrentUser } from '@/utils/handleAuth';
import { SOCKET_EVENTS } from '@/utils/constant';
import { useDispatch } from 'react-redux';
import { setChatAccessAction } from '@/lib/slices/chat/chatSlice';
import Toast from '@/utils/toast';
import { decodedObjectId } from '@/utils/helper';
import { RootState } from '@/lib/store';
import { matchedBrain } from '../Brains/BrainList';
import DocumentIcon from '@/icons/DocumentIcon';
import useConversation from '@/hooks/conversation/useConversation';

const HeaderLayout = () => {
    const params = useParams();
    const chatAccess = useSelector((store:RootState) => store.chat.chatAccess);
    const dispatch = useDispatch();
    const socket = useSocket();
    const currentUser = useMemo(() => getCurrentUser(), []);
    const companyId = useMemo(() => getCompanyId(currentUser), [currentUser]);
    const {conversations} = useConversation()
    
    useEffect(() => {
        if (socket) {
            socket.emit(SOCKET_EVENTS.JOIN_CHAT_ROOM, { chatId: params.id, companyId, userId: currentUser._id });
            socket.emit(SOCKET_EVENTS.JOIN_COMPANY_ROOM, { companyId });
            socket.emit(SOCKET_EVENTS.LOAD_CONVERSATION, { chatId: params.id, companyId, userId: currentUser._id , isNewChat : conversations.length == 0});
            socket.on(SOCKET_EVENTS.LOAD_CONVERSATION, ({ access }) => {
                dispatch(setChatAccessAction(access));
                if (!access) Toast('You are not allowed to access this chat', 'error');
            });

            socket.on('disconnect', () => {
                socket.emit(SOCKET_EVENTS.LEAVE_CHAT_ROOM, { chatId: params.id });
            });
            return () => {
                socket.off('disconnect');
                socket.off(SOCKET_EVENTS.LOAD_CONVERSATION, () => {});
            };
        }
    }, [socket]);
    
    return (
        <header className="top-header md:h-[68px] min-h-[68px] flex md:border-b-0 border-b border-b10  items-center md:justify-between py-2 lg:pl-[15px] pl-[50px] pr-[15px]">
            {chatAccess && <UserModel />}
            <div className="header-right ml-auto flex items-center md:gap-2.5 gap-1.5 md:mt-0">
                {chatAccess && (
                    <MemberList className="flex-shrink-0" />
                )}
            </div>
        </header>
    );
};

const ListHeaderLayout = ({ heading, icons }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const brainId = searchParams.get('b') ? decodedObjectId(searchParams.get('b')) : null;
    const braindata = useSelector((store:RootState) => store.brain.combined);
    const data = matchedBrain(braindata, brainId);

    return (
        <header className="top-header h-[68px] min-h-[68px] flex items-center space-x-2 py-2 md:pl-[15px] pl-[50px] pr-[15px]">
            <div className="size-[30px] flex items-center justify-center rounded-full p-1">
                {icons} 
            </div>
            <p className="text-font-16 font-bold">{heading}</p>
            {pathname !== routes.customGPTAdd && (
                <>
                    <span className="inline-block mx-2.5">/</span>
                    <p className='text-font-14'>{data?.title}</p>
                </>
            )}
        </header>
    );
};

export const UserHeaderLayout = () => {
    return (
        <header className="top-header h-[68px] min-h-[68px] border-b border-b11 flex items-center justify-between py-2 px-6">
            <p className="text-font-16 font-bold">Weam</p>
            <div className="ml-auto flex items-center">
                <Image
                    src={UserImage}
                    width={'40'}
                    height={'40'}
                    className="size-10 rounded-full me-2.5"
                    alt='User Image'
                />
                <span className="text-font-18 font-semibold text-b2">
                    Welcome back, John!
                </span>
            </div>
        </header>
    );
};

const Header = () => {
    const pathname = usePathname();

    const isDynamicChatPath = (path) => {
        // Match paths like '/chat-list/id', '/chat-list/id', etc.
        const chatListRegex = /^\/chat\/[a-fA-F0-9]{24}$/;
        return chatListRegex.test(path);
    };

    const headerComponents = {
        [routes.chat]: (
            <ListHeaderLayout
                heading={'Chats'}
                icons={
                    <ChatThreadIcon
                        width={'18'}
                        height={'18'}
                        className={'fill-b2 object-contain'}
                    />
                }
            />
        ),
        [routes.prompts]: (
            <ListHeaderLayout
                heading={'Prompts'}
                icons={
                    <PromptIcon
                        width={'18'}
                        height={'18'}
                        className={'fill-b2 object-contain'}
                    />
                }
            />
        ),
        [routes.customGPT]: (
            <ListHeaderLayout
                heading={'Agents'}
                icons={
                    <Customgpt
                        width={'18'}
                        height={'18'}
                        className={'fill-b2 object-contain'}
                    />
                }
            />
        ),
        [routes.customGPTAdd]: (
            <ListHeaderLayout
                heading={'Agents'}
                icons={
                    <Customgpt
                        width={'18'}
                        height={'18'}
                        className={'fill-b2 object-contain'}
                    />
                }
            />
        ),
        [routes.docs]: (
            <ListHeaderLayout
                heading={'Docs'}
                icons={
                    <DocumentIcon
                        width={'18'}
                        height={'18'}
                        className={'fill-b2 object-contain'}
                    />
                }
            />
        ),
    };

    if (isDynamicChatPath(pathname)) return <HeaderLayout />;

    return headerComponents[pathname];
};

export default Header;

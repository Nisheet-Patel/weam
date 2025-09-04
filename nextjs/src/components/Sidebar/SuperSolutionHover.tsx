'use client';

import { useState, useEffect } from 'react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '../ui/hover-card';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '../ui/dialog';
import useSuperSolution from '@/hooks/superSolution/useSuperSolution';
import { getCurrentUser } from '@/utils/handleAuth';
import Link from 'next/link';
import { ROLE_TYPE } from '@/utils/constant';
import { LINK } from '@/config/config';
import { getIconComponent } from '@/utils/iconMapping';
import SolutionAppIcon from '@/icons/SolutionsIcons';
import { useMediaQuery } from '@/hooks/use-media-query';

interface SuperSolutionHoverProps {
    className?: string;
}

type AppData = {
    id: string;
    _id: string;
    name: string;
    icon: string;
    pathToOpen: string;
};

type SolutionData = {
    _id: string;
    appId: AppData;
    pathToOpen: string;
    name: string;
};

const SuperSolutionHover = ({ className }: SuperSolutionHoverProps) => {
    const [solutions, setSolutions] = useState<SolutionData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { getSolutionAppByUserId } = useSuperSolution();
    const user = getCurrentUser();
    const isMobile = useMediaQuery('(max-width: 1024px)');

    const fetchUserSolutions = async () => {
        if (!user?._id || hasLoaded) return;

        try {
            setIsLoading(true);
            const data = await getSolutionAppByUserId(user._id);

            setSolutions(data || []);
            setHasLoaded(true);
        } catch (error) {
            console.error('Error fetching user solutions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTriggerClick = () => {
        if (!hasLoaded) {
            fetchUserSolutions();
        }
        setIsDialogOpen(true);
    };

    const renderContent = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-b12 rounded-lg flex items-center justify-center">
                    <SolutionAppIcon
                        width={16}
                        height={16}
                        className="w-4 h-4 fill-b2"
                    />
                </div>
                <h4 className="font-semibold text-gray-900">
                    Your Apps
                </h4>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">
                        Loading solutions...
                    </span>
                </div>
            ) : solutions.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto">
                    {solutions.map((solution) => (
                        <Link
                            key={
                                ROLE_TYPE.USER === user?.roleCode
                                    ? solution?.appId?._id
                                    : solution?._id
                            }
                            href={
                                ROLE_TYPE.USER === user?.roleCode
                                    ? `${LINK.DOMAIN_URL}${solution?.appId?.pathToOpen}`
                                    : `${LINK.DOMAIN_URL}${solution?.pathToOpen}`
                            }
                            className="group flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-200">
                                {ROLE_TYPE.USER === user?.roleCode
                                    ? (() => {
                                          const IconComponent =
                                              getIconComponent(
                                                  solution?.appId
                                                      ?.icon
                                              );
                                          return (
                                              <IconComponent className="w-6 h-6 text-gray-600" />
                                          );
                                      })()
                                    : (() => {
                                          const IconComponent =
                                              getIconComponent(
                                                  solution?.icon
                                              );
                                          return (
                                              <IconComponent className="w-6 h-6 text-gray-600" />
                                          );
                                      })()
                                }
                            </div>
                            <span className="text-font-14 text-gray-700 text-center font-medium group-hover:text-blue-600 transition-colors">
                                {ROLE_TYPE.USER === user?.roleCode
                                    ? solution?.appId?.name
                                    : solution?.name}
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <SolutionAppIcon
                            width={24}
                            height={24}
                            className="w-6 h-6 fill-gray-400"
                        />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                        No Apps available
                    </p>
                    <p className="text-xs text-gray-400">
                        Create your first app to get started
                    </p>
                </div>
            )}

            {/* <div className="pt-4 border-t border-gray-100">
                <Link
                    href="/settings/super-solution"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                    <span>View all solutions</span>
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Link>
            </div> */}
        </div>
    );

    const triggerElement = (
        <div className={className}>
            <SolutionAppIcon
                width={16}
                height={16}
                className={'size-[18px] fill-b5'}
            />
            <span className='collapsed-text'>Apps</span>
        </div>
    );

    if (isMobile) {
        return (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <div onClick={handleTriggerClick}>
                        {triggerElement}
                    </div>
                </DialogTrigger>
                <DialogContent 
                    className="border-none bg-white shadow-xl rounded-xl p-6 min-w-[320px] max-w-[400px] z-50 max-h-[80vh] overflow-y-auto"
                    showCloseButton={true}
                >
                    {renderContent()}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <HoverCard openDelay={300}>
            <HoverCardTrigger asChild>
                <div 
                    onPointerEnter={() => {
                        if (!hasLoaded) {
                            fetchUserSolutions();
                        }
                    }}
                >
                    {triggerElement}
                </div>
            </HoverCardTrigger>
            <HoverCardContent
                side="right"
                className="border-none bg-white shadow-xl rounded-xl p-6 min-w-[320px] max-w-[400px] z-50 rounded"
                sideOffset={18}
            >
                {renderContent()}
            </HoverCardContent>
            </HoverCard>
    );
};

export default SuperSolutionHover;

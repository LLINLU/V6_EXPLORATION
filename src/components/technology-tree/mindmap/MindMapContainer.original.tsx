// import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { transformToMindMapData } from "@/utils/mindMapDataTransform";
// import { MindMapNodeComponent } from "./MindMapNode";
// import { MindMapConnections } from "./MindMapConnections";
// // import { MindMapControls } from "./MindMapControls"; // Component file not found
// import { MindMapLegend } from "./MindMapLegend";
// import { useTreeUIStore } from "@/stores/treeUIStore";
// import { useChatStore } from "@/stores/chatStore";

// import { MindMapFullscreenNav } from "./MindMapFullscreenNav";
// import { usePanZoom } from "@/hooks/tree/usePanZoom";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { TreeNode } from "@/types/tree";
// import { useTreeGeneration } from "@/hooks/useTreeGeneration";
// import { toast } from "@/components/ui/use-toast";

// //仮で現在の型に合わせる（後で修正）
// interface SelectedPath {
//   level1?: string;
//   level2?: string;
//   level3?: string;
//   level4?: string;
//   level5?: string;
//   level6?: string;
//   level7?: string;
//   level8?: string;
//   level9?: string;
//   level10?: string;
// }

// // レベルデータの型定義
// type LevelDataMap = Record<number, Record<string, TreeNode[]>>;
// const MAX_SUPPORTED_LEVEL = 10;
// const MIN_DIRECT_EXPAND_LEVEL = 3;

// interface SelectedNodeForResearch {
//   id: string;
//   title: string;
//   description?: string;
//   level: number;
// }

// interface MindMapContainerProps {
//   selectedPath: SelectedPath;
//   level1Items: TreeNode[];
//   level2Items: Record<string, TreeNode[]>;
//   level3Items: Record<string, TreeNode[]>;
//   level4Items: Record<string, TreeNode[]>;
//   level5Items: Record<string, TreeNode[]>;
//   level6Items: Record<string, TreeNode[]>;
//   level7Items: Record<string, TreeNode[]>;
//   level8Items: Record<string, TreeNode[]>;
//   level9Items: Record<string, TreeNode[]>;
//   level10Items: Record<string, TreeNode[]>;
//   levelNames: Record<string, string>;
//   query?: string;
//   onNodeClick: (level: string, nodeId: string) => void;
//   onEditNode?: (level: string, nodeId: string, updatedNode: {
//     title: string;
//     description: string;
//   }) => void;
//   onDeleteNode?: (level: string, nodeId: string) => void;
//   treeMode?: string;
//   justSwitchedView?: boolean;
//   getMindmapExpansionState?: () => Set<string>;
//   onResearchPanelChange?: (isVisible: boolean, nodeData?: SelectedNodeForResearch) => void;
//   onAiAssist?: (nodeId?: string, nodeTitle?: string, nodeDescription?: string, level?: number) => void;
//   // Fullscreen state props
//   isFullscreen?: boolean;
//   onToggleFullscreen?: () => void;
//   // Panel content for fullscreen mode
//   researchPanelContent?: React.ReactNode;
//   chatboxContent?: React.ReactNode;
// }

// export const MindMapContainer: React.FC<MindMapContainerProps> = ({
//   selectedPath,
//   level1Items,
//   level2Items,
//   level3Items,
//   level4Items,
//   level5Items,
//   level6Items,
//   level7Items,
//   level8Items,
//   level9Items,
//   level10Items,
//   levelNames,
//   query,
//   onNodeClick,
//   onEditNode,
//   onDeleteNode,
//   treeMode,
//   justSwitchedView,
//   getMindmapExpansionState,
//   onResearchPanelChange,
//   onAiAssist,
//   isFullscreen: externalIsFullscreen,
//   onToggleFullscreen,
//   researchPanelContent,
//   chatboxContent,
// }) => {
//   const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');
//   const [selectedNodeForHighlight, setSelectedNodeForHighlight] = useState<string | null>(null);
//   const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
//   const [lastQuery, setLastQuery] = useState<string>('');
//   const [isInitialized, setIsInitialized] = useState<boolean>(false);
//   // Use external fullscreen state if provided, otherwise use internal state
//   const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : false;

//   const [showResearchPanel, setShowResearchPanel] = useState<boolean>(false);
//   const [fullscreenChatOpen, setFullscreenChatOpen] = useState<boolean>(false);
//   const [cursorStyle, setCursorStyle] = useState<string>('grab');

//   const [selectedNodeForResearch, setSelectedNodeForResearch] = useState<SelectedNodeForResearch | null>(null);

//   // const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(true); // Commented out - used by MindMapControls
//   const [showNavigation, setShowNavigation] = useState<boolean>(true);

//   // Search functionality state
//   const [searchValue, setSearchValue] = useState<string>(query || "");
//   const [searchMode, setSearchMode] = useState<"TED" | "FAST">("TED");

//   const containerRef = useRef<HTMLDivElement>(null);
//   const researchPanelRef = useRef<HTMLDivElement>(null);
//   const chatPanelRef = useRef<HTMLDivElement>(null);

//   const navigate = useNavigate();
//   const { generateTree, isGenerating } = useTreeGeneration();

//   const {
//     nodes,
//     connections
//   } = useMemo(() => {
//     return transformToMindMapData(
//       level1Items || [],
//       level2Items || {},
//       level3Items || {},
//       level4Items || {},
//       level5Items || {},
//       level6Items || {},
//       level7Items || {},
//       level8Items || {},
//       level9Items || {},
//       level10Items || {},
//       levelNames,
//       selectedPath,
//       query || "Research Query",
//       layoutDirection,
//       expandedNodes,
//       selectedNodeForHighlight
//     );
//   }, [level1Items, level2Items, level3Items, level4Items, level5Items, level6Items, level7Items, level8Items, level9Items, level10Items, levelNames, selectedPath, query, layoutDirection, expandedNodes, selectedNodeForHighlight]);

//   // ノード情報を更新する共通ヘルパー
//   const updateSelectedNode = (nodeId: string, level: number) => {
//     if (level === 0) return null;

//     setSelectedNodeForHighlight(nodeId);
//     const node = nodes.find(n => n.id === nodeId);

//     if (node) {
//       const nodeForResearch = {
//         id: node.id,
//         title: node.name,
//         description: node.description,
//         level: node.level
//       };
//       setSelectedNodeForResearch(nodeForResearch);
//       return nodeForResearch;
//     }
//     return null;
//   };

//   const handleNodeClick = (nodeId: string, level: number) => {
//     if (level === 0) return;

//     // ノードクリック時の親コンポーネント通知
//     onNodeClick(`level${level}`, nodeId);

//     // 常にノード情報を更新
//     const nodeData = updateSelectedNode(nodeId, level);

//     if (!isFullscreen) {
//       // 非フルスクリーン時: リサーチパネルを開く
//       if (nodeData && onResearchPanelChange) {
//         onResearchPanelChange(true, nodeData);
//       }
//     }
//     // フルスクリーン時はノード選択のみ（パネル開閉は独立）
//   };

//   const { setChatBoxOpen } = useTreeUIStore();

//   // Chat display mode management - import from chatStore
//   const { setChatDisplayMode } = useChatStore();

//   const handleAiAssist = (nodeId: string, level: number) => {
//     if (level === 0) return;

//     // AI Assistantはノードクリックと同じ動作をするべき
//     // 1. 親コンポーネントに通知
//     onNodeClick(`level${level}`, nodeId);

//     // 2. 常にノード情報を更新（前の選択をクリア）
//     const nodeData = updateSelectedNode(nodeId, level);

//     // 3. リサーチパネルを更新（非フルスクリーン時）
//     if (!isFullscreen && nodeData && onResearchPanelChange) {
//       onResearchPanelChange(true, nodeData);
//     }

//     // 4. チャットパネルを開く
//     if (!isFullscreen) {
//       setChatBoxOpen(true);
//       setChatDisplayMode('panel');
//     } else {
//       setFullscreenChatOpen(true);
//     }

//     // 5. AI Assistantコールバックを実行
//     const node = nodes.find(n => n.id === nodeId);
//     if (node && onAiAssist) {
//       onAiAssist(node.id, node.name, node.description, level);
//     } else if (onAiAssist) {
//       onAiAssist();
//     }
//   };

//   const handleAddNode = (_nodeId: string, _level: number) => {
//     // Add node functionality would be implemented here
//   };

//   const getNodeWidth = () => layoutDirection === 'horizontal' ? 280 : 260;
//   const getNodeHeight = () => layoutDirection === 'horizontal' ? 100 : 60;

//   // Calculate container width based on panel states
//   const calculateContainerWidth = () => {
//     // In normal mode, always use 100% width - TechTreeLayout handles the layout
//     if (!isFullscreen) {
//       return window.innerWidth; // Full width in normal mode
//     }

//     // In fullscreen mode, calculate based on active panels
//     const baseWidth = window.innerWidth;
//     let reduction = 0;

//     // Count active panels (only in fullscreen mode)
//     const activePanels = (showResearchPanel ? 1 : 0) + (fullscreenChatOpen ? 1 : 0);
//     reduction = activePanels * 384; // Each panel is 384px

//     return baseWidth - reduction;
//   };

//   // Search handlers
//   const handleSearchValueChange = (value: string) => {
//     setSearchValue(value);
//   };

//   const handleSearchModeChange = (mode: "TED" | "FAST") => {
//     setSearchMode(mode);
//   };

//   const handleSearchSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!searchValue.trim()) {
//       toast({
//         title: "エラー",
//         description: "検索クエリを入力してください",
//       });
//       return;
//     }

//     try {
//       const result = await generateTree(searchValue.trim(), searchMode);
//       if (result) {
//         navigate("/technology-tree", {
//           state: {
//             query: searchValue.trim(),
//             scenario: result.treeStructure?.scenario_inputs?.scenario,
//             searchMode: "deep",
//             treeData: result.treeStructure,
//             treeId: result.treeId,
//             fromDatabase: true,
//             isGenerating: (result as any).status === "generating",
//           },
//           replace: true,
//         });
//       }
//     } catch (error) {
//       toast({
//         title: "生成エラー",
//         description: "ツリーの再生成に失敗しました。再試行してください。",
//       });
//     }
//   };

//   const baseContainerWidth = calculateContainerWidth();
//   const baseContainerHeight = isFullscreen ? (showNavigation ? window.innerHeight - 56 : window.innerHeight) : 600; // Subtract navigation height in fullscreen only if navigation is visible
//   const containerWidth = nodes.length > 0 ? Math.max(...nodes.map(n => n.x + getNodeWidth() + 100), baseContainerWidth) : baseContainerWidth;
//   const containerHeight = nodes.length > 0 ? Math.max(...nodes.map(n => n.y + getNodeHeight() + 100), baseContainerHeight) : baseContainerHeight;

//   // Calculate mindmap container width for styling
//   const mindmapContainerWidth = isFullscreen ? `${baseContainerWidth}px` : '100%';

//   // Get preserved pan/zoom state when switching back to mind map
//   // const preservedPanZoomState = justSwitchedView && getMindmapPanZoomState ? getMindmapPanZoomState() : undefined; // Unused

//   // Efficient panel area detection using actual DOM elements
//   const isMouseOverAnyPanel = useCallback((mouseX: number, mouseY: number) => {
//     if (!isFullscreen) return false;

//     // Check active panel elements using their actual DOM bounds
//     const panelElements = [
//       fullscreenChatOpen && chatPanelRef.current,
//       showResearchPanel && researchPanelRef.current
//     ].filter(Boolean);

//     return panelElements.some(element => {
//       if (!element) return false;
//       const rect = element.getBoundingClientRect();
//       return mouseX >= rect.left && mouseX <= rect.right &&
//              mouseY >= rect.top && mouseY <= rect.bottom;
//     });
//   }, [isFullscreen, fullscreenChatOpen, showResearchPanel]);

//   const {
//     isDragging,
//     handleWheel,
//     handleMouseDown,
//     handleMouseMove,
//     handleMouseUp,
//     handleMouseLeave,
//     resetView,

//     getCSSTransform,
//     getCurrentState,
//     isMouseOverPanelArea
//   } = usePanZoom();

//   const handleContainerWheel = useCallback((e: React.WheelEvent) => {
//     // If mouse is over panel area, don't handle wheel event for mindmap
//     if (isMouseOverPanelArea(e.clientX) || isMouseOverAnyPanel(e.clientX, e.clientY)) {
//       return;
//     }

//     e.stopPropagation();
//     e.preventDefault();
//     if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
//       e.nativeEvent.stopImmediatePropagation();
//     }
//     handleWheel(e);
//   }, [handleWheel, isMouseOverPanelArea, isMouseOverAnyPanel]);

//   const toggleLayout = () => {
//     setLayoutDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
//     // Automatically center the view after layout change
//     setTimeout(() => {
//       resetView();
//     }, 100); // Small delay to ensure layout change has completed
//   };

//   const handleToggleExpand = (nodeId: string, isExpanded: boolean) => {
//     setExpandedNodes(prev => {
//       const newSet = new Set(prev);
//       if (isExpanded) {
//         newSet.add(nodeId);
//       } else {
//         newSet.delete(nodeId);
//       }
//       return newSet;
//     });
//   };

//   const handleLevelExpand = (level: number) => {
//     setExpandedNodes(prev => {
//       const newSet = new Set(prev);
//       const maxLevel = getMaxAvailableLevel();

//       if (level === 2) {
//         // レベル2：従来通りレベル1ノードを展開
//         nodes.forEach(node => {
//           if (node.level === 1) {
//             newSet.add(node.id);
//           }
//         });
//       } else if (level >= MIN_DIRECT_EXPAND_LEVEL && level <= maxLevel) {
//         // レベル3以上：直接展開ロジック（動的に最大レベルまで対応）
//         expandToTargetLevel(newSet, level);
//       }

//       return newSet;
//     });
//   };

//   // ヘルパー関数：指定されたレベルまで必要な親ノードを展開
//   const expandToTargetLevel = (expandedSet: Set<string>, targetLevel: number) => {
//     const allLevelData = getAllLevelData();

//     // rootを展開
//     expandedSet.add('root');

//     // targetLevelまでの各レベルを順次展開
//     for (let currentLevel = 2; currentLevel <= targetLevel; currentLevel++) {
//       const levelData = allLevelData[currentLevel];
//       if (levelData) {
//         expandNodesWithChildren(expandedSet, levelData);
//       }
//     }
//   };

//   const handleLevelCollapse = (level: number) => {
//     setExpandedNodes(prev => {
//       const newSet = new Set(prev);
//       const maxLevel = getMaxAvailableLevel();

//       if (level === 2) {
//         // レベル2: レベル1ノードを折りたたむ
//         nodes.forEach(node => {
//           if (node.level === 1) {
//             newSet.delete(node.id);
//           }
//         });
//       } else if (level >= MIN_DIRECT_EXPAND_LEVEL && level <= maxLevel) {
//         // レベル3以上：対象レベルを非表示にする（動的に最大レベルまで対応）
//         collapseTargetLevel(newSet, level);
//       }

//       return newSet;
//     });
//   };

//   // ヘルパー関数：指定されたレベルを折りたたむ
//   const collapseTargetLevel = (expandedSet: Set<string>, targetLevel: number) => {
//     const allLevelData = getAllLevelData();
//     const levelData = allLevelData[targetLevel];

//     if (levelData) {
//       // 対象レベルの親ノードを折りたたんで、対象レベルを非表示にする
//       Object.keys(levelData).forEach(parentNodeId => {
//         expandedSet.delete(parentNodeId);
//       });
//     }
//   };

//   const isLevelExpanded = (level: number): boolean => {
//     const maxLevel = getMaxAvailableLevel();

//     if (level === 2) {
//       // レベル2：レベル1ノードの展開状態をチェック（従来通り）
//       return nodes.some(node => node.level === 1 && expandedNodes.has(node.id));
//     } else if (level >= MIN_DIRECT_EXPAND_LEVEL && level <= maxLevel) {
//       // レベル3以上：親レベルノードの展開状態をチェック（動的に最大レベルまで対応）
//       return checkLevelExpansion(level);
//     }
//     return false;
//   };

//   // 動的にレベルデータマッピングを生成（将来のレベル拡張に対応）
//   const getAllLevelData = (): LevelDataMap => {
//     // 注意：新しいレベルを追加する場合は、propsにもlevel11Items等を追加する必要があります
//     const levelDataArray = [
//       level1Items, level2Items, level3Items, level4Items, level5Items,
//       level6Items, level7Items, level8Items, level9Items, level10Items
//     ];

//     const levelDataMap: Record<number, Record<string, TreeNode[]>> = {};

//     // level1は配列なので特別扱い（level1Items -> { root: level1Items }）
//     levelDataMap[1] = { 'root': level1Items || [] };

//     // level2以降は Record<string, TreeNode[]> 形式
//     levelDataArray.slice(1).forEach((levelData, index) => {
//       const levelNumber = index + 2; // level2から開始（index 0 = level2）
//       if (levelNumber <= MAX_SUPPORTED_LEVEL && levelData && Object.keys(levelData).length > 0) {
//         levelDataMap[levelNumber as keyof typeof levelDataMap] = levelData as Record<string, TreeNode[]>;
//       }
//     });

//     return levelDataMap;
//   };

//   // 利用可能な最大レベルを動的に取得
//   const getMaxAvailableLevel = (): number => {
//     const allLevelData = getAllLevelData();
//     const availableLevels = Object.keys(allLevelData)
//       .map(Number)
//       .filter(level => level > 1); // level1は除外（rootなので）

//     return Math.max(...availableLevels, 2); // 最低でもlevel2
//   };

//   // 子を持つノードを展開セットに追加
//   const expandNodesWithChildren = (expandedSet: Set<string>, levelData: Record<string, TreeNode[]>) => {
//     Object.keys(levelData).forEach(parentNodeId => {
//       const children = levelData[parentNodeId];
//       if (children && children.length > 0) {
//         expandedSet.add(parentNodeId);
//       }
//     });
//   };

//   // ヘルパー関数：レベルの展開状態をチェック
//   const checkLevelExpansion = (level: number): boolean => {
//     const allLevelData = getAllLevelData();
//     const levelData = allLevelData[level];

//     if (!levelData) return false;

//     // 対象レベルの親ノードのいずれかが展開されているかチェック
//     return Object.keys(levelData).some(parentNodeId =>
//       expandedNodes.has(parentNodeId) &&
//       levelData[parentNodeId] &&
//       levelData[parentNodeId].length > 0
//     );
//   };

//   const toggleFullscreen = () => {
//     // Use external fullscreen handler if provided
//     if (onToggleFullscreen) {
//       onToggleFullscreen();
//     }
//   };

//   // const toggleControlsCollapse = () => {
//   //   setIsControlsCollapsed(prev => !prev);
//   // }; // Commented out - used by MindMapControls

//   const toggleNavigation = () => {
//     setShowNavigation(prev => !prev);
//   };

//   // フルスクリーンから通常モードに戻った時の状態クリーンアップ
//   useEffect(() => {
//     if (!isFullscreen) {
//       // 通常モードに戻った時、フルスクリーン用のローカル状態をリセット
//       setShowResearchPanel(false);
//       setFullscreenChatOpen(false);
//     }
//   }, [isFullscreen]);

//   // フルスクリーン時のリサーチパネル切り替え
//   const handleToggleResearchPanelFromNav = () => {
//     setShowResearchPanel(prev => {
//       const newState = !prev;

//       // リサーチパネルを開く時にノードが未選択の場合、デフォルトメッセージを設定
//       if (newState && !selectedNodeForResearch) {
//         setSelectedNodeForResearch({
//           id: '',
//           title: 'Select a node to view research',
//           description: 'Click on any node in the mindmap to see papers and implementation examples.',
//           level: 1
//         });
//       }

//       return newState;
//     });
//   };

//   // フルスクリーン時のチャットパネル切り替え
//   const handleToggleChatPanelFromNav = () => {
//     setFullscreenChatOpen(!fullscreenChatOpen);
//   };

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === 'Escape' && isFullscreen) {
//         if (onToggleFullscreen) {
//           onToggleFullscreen();
//         }

//       }

//       // Handle Cmd+\ or Ctrl+\ for navigation toggle in fullscreen mode
//       if (isFullscreen && event.key === '\\' && (event.metaKey || event.ctrlKey)) {
//         event.preventDefault();
//         setShowNavigation(prev => !prev);
//       }
//     };

//     if (isFullscreen) {
//       document.addEventListener('keydown', handleKeyDown);
//     }

//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [isFullscreen, onToggleFullscreen]);

//   // Add wheel event listener with passive: false to prevent default
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     const handleWheelPassive = (event: WheelEvent) => {
//       // If mouse is over panel area, don't handle wheel event for mindmap
//       if (isMouseOverPanelArea(event.clientX) || isMouseOverAnyPanel(event.clientX, event.clientY)) {
//         return;
//       }

//       event.preventDefault();
//       event.stopPropagation();
//       handleContainerWheel(event as any);
//     };

//     container.addEventListener('wheel', handleWheelPassive, { passive: false });

//     return () => {
//       container.removeEventListener('wheel', handleWheelPassive);
//     };
//   }, [handleContainerWheel, isMouseOverPanelArea, isMouseOverAnyPanel]);

//   useEffect(() => {
//     const currentQuery = query || "Research Query";

//     // 初回またはクエリが変更された場合のみ初期展開状態を設定
//     if ((!isInitialized || currentQuery !== lastQuery) && level1Items && level1Items.length > 0) {
//       // Prevent initialization during rapid state changes
//       const timeoutId = setTimeout(() => {
//         setExpandedNodes(_prev => {
//           // If we're switching back to mind map view, try to restore previous expansion state
//           if (justSwitchedView && getMindmapExpansionState) {
//             const preservedState = getMindmapExpansionState();
//             if (preservedState.size > 0) {
//               return preservedState;
//             }
//           }

//           // Show only level 1 nodes by default (root expanded, but level 1 nodes collapsed)
//           // This makes level 1 nodes visible but keeps their children hidden
//           return new Set(['root']);
//         });
//         setLastQuery(currentQuery);
//         setIsInitialized(true);
//       }, 50); // Small delay to prevent rapid state changes

//       return () => clearTimeout(timeoutId);
//     }
//   }, [query, level1Items?.length, lastQuery, isInitialized, justSwitchedView]);

//   // Save state on unmount as fallback - use refs to capture latest values
//   const latestExpandedNodesRef = useRef(expandedNodes);
//   const latestGetCurrentStateRef = useRef(getCurrentState);

//   // Update refs with latest values
//   latestExpandedNodesRef.current = expandedNodes;
//   latestGetCurrentStateRef.current = getCurrentState;

//   // ノードデータはtransformToMindMapDataで正しく計算されているので、上書きしない
//   const nodesWithExpandState = nodes;

//   useEffect(() => {
//     if (treeMode === "FAST") {
//       setSearchMode("FAST");
//     } else if (treeMode === "TED") {
//       setSearchMode("TED");
//     } else {
//       setSearchMode("TED");
//     }
//   }, [treeMode]);

//   useEffect(() => {
//     setSearchValue(query || "");
//   }, [query]);

//   // Update cursor when dragging state changes
//   useEffect(() => {
//     if (isDragging) {
//       setCursorStyle('grabbing');
//     }
//   }, [isDragging]);

//   // Mindmap container styling based on fullscreen mode
//   const containerWidthStyle = isFullscreen ? mindmapContainerWidth : '100%';

//   const containerContent = (
//     <div
//       ref={containerRef}
//       className={`${isFullscreen ? 'w-screen h-screen' : 'w-full h-full'} overflow-hidden bg-white relative mindmap-outer-container`}
//       onWheel={handleContainerWheel}
//       onMouseDown={(e) => {
//         // Don't handle mouse events over panel areas
//         if (isMouseOverPanelArea(e.clientX) || isMouseOverAnyPanel(e.clientX, e.clientY)) {
//           return;
//         }
//         handleMouseDown(e);
//       }}
//       onMouseMove={(e) => {
//         // Update cursor based on mouse position
//         const isOverPanel = isMouseOverPanelArea(e.clientX) || isMouseOverAnyPanel(e.clientX, e.clientY);

//         if (isOverPanel) {
//           setCursorStyle('default');
//           return;
//         } else {
//           setCursorStyle(isDragging ? 'grabbing' : 'grab');
//         }

//         handleMouseMove(e);
//       }}
//       onMouseUp={handleMouseUp}
//       onMouseLeave={(e) => {
//         setCursorStyle('grab');
//         handleMouseLeave();
//       }}
//       style={{
//         touchAction: 'none',
//         borderRadius: isFullscreen ? '0px' : '8px',
//         cursor: cursorStyle,
//         userSelect: isDragging ? 'none' : 'auto',
//         width: containerWidthStyle
//       }}
//     >
//       <div style={{
//         width: containerWidth,
//         height: containerHeight,
//         minWidth: "100%",
//         minHeight: "100%",
//         transform: getCSSTransform(),
//         borderRadius: '8px'
//       }} className={`relative origin-top-left mindmap-content ${!justSwitchedView && !isDragging ? 'transition-transform duration-150 ease-out' : ''}`}>
//         <MindMapConnections connections={connections} layoutDirection={layoutDirection} selectedNodeId={selectedNodeForHighlight} />

//         {nodesWithExpandState.map(node => <MindMapNodeComponent key={node.id} node={node} layoutDirection={layoutDirection} onClick={handleNodeClick} onEdit={onEditNode} onDelete={onDeleteNode} onAiAssist={handleAiAssist} onAddNode={handleAddNode} onToggleExpand={handleToggleExpand} />)}

//         {nodesWithExpandState.length === 0 && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500">
//             <p className="text-lg">No data available for mindmap view</p>
//             <p className="text-sm mt-2">Please ensure your tree has been generated</p>
//           </div>}
//       </div>

//       {/* Fullscreen Panels */}
//       {isFullscreen && (
//         <>
//           {/* Research Panel */}
//           {showResearchPanel && researchPanelContent && (
//             <div
//               ref={researchPanelRef}
//               className={`fixed top-14 h-[calc(100vh-64px)] w-96 bg-white border border-gray-200 rounded-lg m-1 z-50 ${
//                 fullscreenChatOpen ? 'right-[400px]' : 'right-0'
//               }`}
//               style={{ pointerEvents: 'auto' }}
//             >
//               {React.cloneElement(researchPanelContent as React.ReactElement, {
//                 isFullscreenMode: true,
//                 onClose: () => setShowResearchPanel(false)
//               })}
//             </div>
//           )}

//           {/* Chat Panel */}
//           {fullscreenChatOpen && chatboxContent && (
//             <div
//               ref={chatPanelRef}
//               className="fixed top-14 right-0 h-[calc(100vh-64px)] w-96 bg-white border border-gray-200 rounded-lg m-1 z-50"
//               style={{ pointerEvents: 'auto' }}
//             >
//               <div className="h-full overflow-hidden">
//                 {React.cloneElement(chatboxContent as React.ReactElement, {
//                   isFullscreenMode: true,
//                   onClose: () => setFullscreenChatOpen(false)
//                 })}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       {/* Research Panel for normal mode - managed by parent component, not local state */}

//       {/* Legend positioned inside container but outside transformed content */}
//       <MindMapLegend
//         treeMode={treeMode}
//         onLevelExpand={handleLevelExpand}
//         onLevelCollapse={handleLevelCollapse}
//         isLevelExpanded={isLevelExpanded}
//       />

//       {/* MindMapControls component not found - commenting out for build
//       <MindMapControls
//         zoom={zoom}
//         onZoomIn={zoomIn}
//         onZoomOut={zoomOut}
//         onResetView={resetView}
//         layoutDirection={layoutDirection}
//         onToggleLayout={toggleLayout}
//         isFullscreen={isFullscreen}
//         onToggleFullscreen={toggleFullscreen}
//         isCollapsed={isControlsCollapsed}
//         onToggleCollapse={toggleControlsCollapse}
//       /> */}
//     </div>
//   );

//   return <TooltipProvider delayDuration={300} skipDelayDuration={100}>
//     {isFullscreen ? (
//       <div className="fixed inset-0 z-50 bg-white">
//         {showNavigation && (
//           <MindMapFullscreenNav
//             onToggleNavigation={toggleNavigation}
//             onToggleResearchPanel={handleToggleResearchPanelFromNav}
//             onToggleChatPanel={handleToggleChatPanelFromNav}
//             showResearchPanel={showResearchPanel}
//             showChatPanel={fullscreenChatOpen}
//             searchValue={searchValue}
//             searchMode={searchMode}
//             isSearching={isGenerating}
//             onSearchValueChange={handleSearchValueChange}
//             onSearchModeChange={handleSearchModeChange}
//             onSearchSubmit={handleSearchSubmit}
//           />
//         )}
//         <div className={showNavigation ? "h-[calc(100vh-56px)]" : "h-screen"}>
//           {containerContent}
//         </div>
//       </div>
//     ) : (
//       containerContent
//     )}
//   </TooltipProvider>;
// };

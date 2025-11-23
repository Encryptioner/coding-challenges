import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

/**
 * Mobile Pull Request Review Component
 * Complete PR review interface optimized for mobile devices (iOS & Android)
 * Features: View changes, add comments, approve/request changes, view conversations
 */

interface PullRequest {
    number: number;
    title: string;
    author: string;
    state: 'open' | 'closed' | 'merged';
    createdAt: string;
    description: string;
    commits: number;
    additions: number;
    deletions: number;
    filesChanged: number;
    reviewers: string[];
}

interface FileChange {
    filename: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
    patch: string;
}

interface Comment {
    id: string;
    author: string;
    body: string;
    createdAt: string;
    line?: number;
    filename?: string;
}

interface MobilePRReviewProps {
    prNumber: number;
    repository: string;
    onClose: () => void;
}

const Container = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--theia-editor-background, #1e1e1e);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    background: var(--theia-toolbar-background, #2d2d2d);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
`;

const BackButton = styled.button`
    background: transparent;
    border: none;
    color: var(--theia-foreground, #cccccc);
    font-size: 24px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const Title = styled.h2`
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--theia-foreground, #cccccc);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const TabBar = styled.div`
    display: flex;
    background: var(--theia-toolbar-background, #2d2d2d);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }
`;

const Tab = styled.button<{ $active: boolean }>`
    flex: 1;
    min-width: 100px;
    padding: 12px 16px;
    background: ${props => props.$active ? 'var(--theia-tab-activeBackground, #1e1e1e)' : 'transparent'};
    border: none;
    border-bottom: 2px solid ${props => props.$active ? 'var(--theia-focusBorder, #007acc)' : 'transparent'};
    color: ${props => props.$active ? 'var(--theia-tab-activeForeground, #ffffff)' : 'var(--theia-tab-inactiveForeground, #969696)'};
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:active {
        background: var(--theia-tab-hoverBackground, #2a2a2a);
    }
`;

const Content = styled.div`
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
`;

const Section = styled.div`
    padding: 16px;
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
`;

const SectionTitle = styled.h3`
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--theia-foreground, #cccccc);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const PRInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--theia-descriptionForeground, #999999);
`;

const Badge = styled.span<{ $type: 'open' | 'closed' | 'merged' | 'default' }>`
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    background: ${props => {
        switch (props.$type) {
            case 'open': return '#238636';
            case 'closed': return '#da3633';
            case 'merged': return '#8250df';
            default: return '#6e7681';
        }
    }};
    color: white;
`;

const Description = styled.p`
    margin: 12px 0 0 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--theia-foreground, #cccccc);
    white-space: pre-wrap;
`;

const FileList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--theia-border, #3e3e3e);
`;

const FileItem = styled.button`
    background: var(--theia-editor-background, #1e1e1e);
    border: none;
    padding: 12px 16px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;

    &:active {
        background: var(--theia-list-hoverBackground, #2a2d2e);
    }
`;

const FileIcon = styled.span<{ $status: string }>`
    font-size: 18px;
    width: 24px;
    text-align: center;

    &::before {
        content: ${props => {
            switch (props.$status) {
                case 'added': return '"+"';
                case 'modified': return '"M"';
                case 'deleted': return '"-"';
                case 'renamed': return '"R"';
                default: return '"F"';
            }
        }};
        color: ${props => {
            switch (props.$status) {
                case 'added': return '#238636';
                case 'modified': return '#d29922';
                case 'deleted': return '#da3633';
                case 'renamed': return '#8250df';
                default: return '#8b949e';
            }
        }};
        font-weight: bold;
    }
`;

const FileName = styled.div`
    flex: 1;
    font-size: 14px;
    color: var(--theia-foreground, #cccccc);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const FileStats = styled.div`
    display: flex;
    gap: 8px;
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
`;

const AdditionsStat = styled.span`
    color: #238636;
`;

const DeletionsStat = styled.span`
    color: #da3633;
`;

const DiffViewer = styled.div`
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
    background: var(--theia-editor-background, #1e1e1e);
`;

const DiffLine = styled.div<{ $type: 'add' | 'delete' | 'neutral' | 'header' }>`
    padding: 2px 8px;
    white-space: pre;
    background: ${props => {
        switch (props.$type) {
            case 'add': return '#1c4d2f';
            case 'delete': return '#6e1414';
            case 'header': return '#2d2d2d';
            default: return 'transparent';
        }
    }};
    color: ${props => {
        switch (props.$type) {
            case 'add': return '#7ee787';
            case 'delete': return '#ff7b72';
            case 'header': return '#8b949e';
            default: return '#c9d1d9';
        }
    }};
    border-left: 3px solid ${props => {
        switch (props.$type) {
            case 'add': return '#238636';
            case 'delete': return '#da3633';
            default: return 'transparent';
        }
    }};

    &:active {
        background: ${props => props.$type === 'neutral' ? 'rgba(42, 45, 46, 0.5)' : undefined};
    }
`;

const CommentList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const CommentItem = styled.div`
    background: var(--theia-editor-background, #1e1e1e);
    border: 1px solid var(--theia-border, #3e3e3e);
    border-radius: 8px;
    padding: 12px;
`;

const CommentHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
`;

const CommentAuthor = styled.span`
    font-weight: 600;
    font-size: 14px;
    color: var(--theia-foreground, #cccccc);
`;

const CommentTime = styled.span`
    font-size: 12px;
    color: var(--theia-descriptionForeground, #999999);
`;

const CommentBody = styled.p`
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--theia-foreground, #cccccc);
    white-space: pre-wrap;
`;

const CommentLocation = styled.div`
    margin-top: 8px;
    padding: 8px;
    background: var(--theia-toolbar-background, #2d2d2d);
    border-radius: 4px;
    font-size: 12px;
    color: var(--theia-descriptionForeground, #999999);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
`;

const ActionBar = styled.div`
    display: flex;
    gap: 8px;
    padding: 16px;
    background: var(--theia-toolbar-background, #2d2d2d);
    border-top: 1px solid var(--theia-border, #3e3e3e);
`;

const ActionButton = styled.button<{ $primary?: boolean; $danger?: boolean }>`
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    min-height: 48px;
    transition: all 0.2s;

    background: ${props => {
        if (props.$primary) return 'var(--theia-button-background, #0e639c)';
        if (props.$danger) return '#da3633';
        return 'var(--theia-button-secondaryBackground, #3a3a3a)';
    }};

    color: ${props =>
        props.$primary || props.$danger
            ? '#ffffff'
            : 'var(--theia-button-secondaryForeground, #cccccc)'
    };

    &:active {
        opacity: 0.8;
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CommentInput = styled.textarea`
    width: 100%;
    min-height: 100px;
    padding: 12px;
    background: var(--theia-input-background, #3c3c3c);
    color: var(--theia-input-foreground, #cccccc);
    border: 1px solid var(--theia-input-border, #3e3e3e);
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    outline: none;

    &:focus {
        border-color: var(--theia-focusBorder, #007acc);
    }
`;

export const MobilePRReview: React.FC<MobilePRReviewProps> = ({ prNumber, repository, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'commits' | 'comments'>('overview');
    const [pr, setPR] = useState<PullRequest | null>(null);
    const [files, setFiles] = useState<FileChange[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);

    // Load PR data
    useEffect(() => {
        loadPRData();
    }, [prNumber]);

    const loadPRData = async () => {
        setLoading(true);
        try {
            // In real implementation, fetch from GitHub API via Octokit
            // For now, mock data
            const mockPR: PullRequest = {
                number: prNumber,
                title: 'Add mobile-friendly code viewer component',
                author: 'developer123',
                state: 'open',
                createdAt: new Date().toISOString(),
                description: 'This PR adds a comprehensive mobile code viewer with:\n- Touch gestures (pinch to zoom, pan)\n- Mobile-optimized controls\n- Search functionality\n- Line numbers overlay\n- Both iOS and Android support',
                commits: 3,
                additions: 427,
                deletions: 52,
                filesChanged: 5,
                reviewers: ['reviewer1', 'reviewer2']
            };

            const mockFiles: FileChange[] = [
                {
                    filename: 'src/components/mobile-code-viewer.tsx',
                    status: 'added',
                    additions: 350,
                    deletions: 0,
                    patch: '@@ -0,0 +1,350 @@\n+import * as React from \'react\';\n+import { useState } from \'react\';\n...'
                },
                {
                    filename: 'src/components/toolbar.tsx',
                    status: 'modified',
                    additions: 45,
                    deletions: 12,
                    patch: '@@ -23,7 +23,8 @@ export const Toolbar = () => {\n-  return <div>Old code</div>;\n+  return <div>New code</div>;'
                }
            ];

            const mockComments: Comment[] = [
                {
                    id: '1',
                    author: 'reviewer1',
                    body: 'Looks great! The touch gestures work smoothly on my iPad.',
                    createdAt: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: '2',
                    author: 'reviewer2',
                    body: 'Could we add a double-tap to zoom feature?',
                    createdAt: new Date(Date.now() - 1800000).toISOString(),
                    filename: 'src/components/mobile-code-viewer.tsx',
                    line: 145
                }
            ];

            setPR(mockPR);
            setFiles(mockFiles);
            setComments(mockComments);
        } catch (error) {
            console.error('Failed to load PR:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        // Implement approval logic
        console.log('Approving PR #', prNumber);
    };

    const handleRequestChanges = async () => {
        // Implement request changes logic
        console.log('Requesting changes for PR #', prNumber);
    };

    const handleComment = async () => {
        if (commentText.trim()) {
            // Post comment
            console.log('Adding comment:', commentText);
            setCommentText('');
        }
    };

    const parseDiff = (patch: string): Array<{ type: 'add' | 'delete' | 'neutral' | 'header'; content: string }> => {
        return patch.split('\n').map(line => {
            if (line.startsWith('+')) return { type: 'add', content: line };
            if (line.startsWith('-')) return { type: 'delete', content: line };
            if (line.startsWith('@@')) return { type: 'header', content: line };
            return { type: 'neutral', content: line };
        });
    };

    if (loading || !pr) {
        return (
            <Container>
                <Header>
                    <BackButton onClick={onClose}>←</BackButton>
                    <Title>Loading PR...</Title>
                </Header>
            </Container>
        );
    }

    return (
        <Container>
            <Header>
                <BackButton onClick={onClose}>←</BackButton>
                <Title>PR #{pr.number}</Title>
            </Header>

            <TabBar>
                <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                    Overview
                </Tab>
                <Tab $active={activeTab === 'files'} onClick={() => setActiveTab('files')}>
                    Files ({pr.filesChanged})
                </Tab>
                <Tab $active={activeTab === 'commits'} onClick={() => setActiveTab('commits')}>
                    Commits ({pr.commits})
                </Tab>
                <Tab $active={activeTab === 'comments'} onClick={() => setActiveTab('comments')}>
                    Comments ({comments.length})
                </Tab>
            </TabBar>

            <Content>
                {activeTab === 'overview' && (
                    <>
                        <Section>
                            <PRInfo>
                                <div>
                                    <Badge $type={pr.state}>{pr.state.toUpperCase()}</Badge>
                                </div>
                                <h1 style={{ margin: 0, fontSize: 18, lineHeight: 1.4 }}>{pr.title}</h1>
                                <InfoRow>
                                    <span>👤 {pr.author}</span>
                                    <span>•</span>
                                    <span>opened {new Date(pr.createdAt).toLocaleDateString()}</span>
                                </InfoRow>
                                <InfoRow>
                                    <AdditionsStat>+{pr.additions}</AdditionsStat>
                                    <DeletionsStat>−{pr.deletions}</DeletionsStat>
                                    <span>•</span>
                                    <span>{pr.filesChanged} files changed</span>
                                </InfoRow>
                                {pr.description && <Description>{pr.description}</Description>}
                            </PRInfo>
                        </Section>

                        <Section>
                            <SectionTitle>Reviewers</SectionTitle>
                            {pr.reviewers.map(reviewer => (
                                <InfoRow key={reviewer}>
                                    <span>👤 {reviewer}</span>
                                </InfoRow>
                            ))}
                        </Section>

                        <Section>
                            <CommentInput
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                        </Section>
                    </>
                )}

                {activeTab === 'files' && !selectedFile && (
                    <FileList>
                        {files.map(file => (
                            <FileItem key={file.filename} onClick={() => setSelectedFile(file)}>
                                <FileIcon $status={file.status} />
                                <FileName>{file.filename}</FileName>
                                <FileStats>
                                    {file.additions > 0 && <AdditionsStat>+{file.additions}</AdditionsStat>}
                                    {file.deletions > 0 && <DeletionsStat>−{file.deletions}</DeletionsStat>}
                                </FileStats>
                            </FileItem>
                        ))}
                    </FileList>
                )}

                {activeTab === 'files' && selectedFile && (
                    <>
                        <Section>
                            <BackButton onClick={() => setSelectedFile(null)}>← Back to files</BackButton>
                            <h3 style={{ marginTop: 12, fontSize: 14 }}>{selectedFile.filename}</h3>
                        </Section>
                        <DiffViewer>
                            {parseDiff(selectedFile.patch).map((line, index) => (
                                <DiffLine key={index} $type={line.type}>
                                    {line.content}
                                </DiffLine>
                            ))}
                        </DiffViewer>
                    </>
                )}

                {activeTab === 'comments' && (
                    <Section>
                        <CommentList>
                            {comments.map(comment => (
                                <CommentItem key={comment.id}>
                                    <CommentHeader>
                                        <CommentAuthor>👤 {comment.author}</CommentAuthor>
                                        <CommentTime>{new Date(comment.createdAt).toLocaleString()}</CommentTime>
                                    </CommentHeader>
                                    <CommentBody>{comment.body}</CommentBody>
                                    {comment.filename && (
                                        <CommentLocation>
                                            📄 {comment.filename}:{comment.line}
                                        </CommentLocation>
                                    )}
                                </CommentItem>
                            ))}
                        </CommentList>
                    </Section>
                )}

                {activeTab === 'commits' && (
                    <Section>
                        <SectionTitle>Commits ({pr.commits})</SectionTitle>
                        <p style={{ color: 'var(--theia-descriptionForeground, #999999)' }}>
                            Commit history will be displayed here
                        </p>
                    </Section>
                )}
            </Content>

            <ActionBar>
                {commentText.trim() ? (
                    <>
                        <ActionButton onClick={() => setCommentText('')}>Cancel</ActionButton>
                        <ActionButton $primary onClick={handleComment}>
                            Comment
                        </ActionButton>
                    </>
                ) : (
                    <>
                        <ActionButton onClick={handleRequestChanges}>
                            Request Changes
                        </ActionButton>
                        <ActionButton $primary onClick={handleApprove}>
                            Approve
                        </ActionButton>
                    </>
                )}
            </ActionBar>
        </Container>
    );
};

export default MobilePRReview;

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Button,
    Input,
    Upload,
    Drawer,
    Avatar,
    List,
    Space,
    Spin,
    message,
    Typography,
} from 'antd';
import {
    MessageOutlined,
    SendOutlined,
    PaperClipOutlined,
    CloseOutlined,
    UserOutlined,
    RobotOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    files?: UploadFile[];
}

interface ChatWidgetProps {
    apiEndpoint?: string;
}

export default function ChatWidget({ apiEndpoint = '/api/openai' }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleFileUpload = (file: UploadFile) => {
        if (file.size && file.size > 5 * 1024 * 1024) {
            message.error('File size must be less than 5MB');
            return false;
        }
        setAttachedFiles(prev => [...prev, file]);
        return false; // Prevent auto upload
    };

    const removeFile = (fileUid: string) => {
        setAttachedFiles(prev => prev.filter(f => f.uid !== fileUid));
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() && attachedFiles.length === 0) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: new Date(),
            files: attachedFiles,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Prepare messages for API
            const apiMessages = messages.concat(userMessage).map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // Handle files - convert to base64 and append to content
            if (attachedFiles.length > 0) {
                for (const file of attachedFiles) {
                    if (file.originFileObj) {
                        const base64 = await fileToBase64(file.originFileObj);
                        apiMessages[apiMessages.length - 1].content += `\n\nFile: ${file.name}\n${base64}`;
                    }
                }
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: apiMessages,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content || 'Sorry, I couldn\'t generate a response.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            message.error('Failed to send message');
            console.error(error);
        } finally {
            setIsLoading(false);
            setAttachedFiles([]);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            <div className="chat-widget">
                <Button
                    icon={<MessageOutlined />}
                    shape="circle"
                    size="large"
                    onClick={toggleChat}
                    className="chat-toggle-btn"
                />
            </div>

            <Drawer
                title="AI Assistant"
                placement="right"
                onClose={toggleChat}
                open={isOpen}
                width={380}
                className="chat-drawer"
                closeIcon={<CloseOutlined />}
            >
                <div className="chat-container">
                    <div className="messages-container">
                        <List
                            dataSource={messages}
                            renderItem={(msg) => (
                                <List.Item className={`message-item ${msg.role}`}>
                                    <Space align="start">
                                        <Avatar
                                            icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                                            size="small"
                                        />
                                        <div className="message-content">
                                            <Text>{msg.content}</Text>
                                            {msg.files && msg.files.length > 0 && (
                                                <div className="attached-files">
                                                    {msg.files.map(file => (
                                                        <div key={file.uid} className="file-item">
                                                            <PaperClipOutlined /> {file.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <Text type="secondary" className="timestamp">
                                                {msg.timestamp.toLocaleTimeString()}
                                            </Text>
                                        </div>
                                    </Space>
                                </List.Item>
                            )}
                        />
                        {isLoading && (
                            <div className="loading-indicator">
                                <Spin size="small" />
                                <Text type="secondary">AI is thinking...</Text>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="input-container">
                        {attachedFiles.length > 0 && (
                            <div className="attached-files-preview">
                                {attachedFiles.map(file => (
                                    <div key={file.uid} className="file-preview">
                                        <PaperClipOutlined /> {file.name}
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CloseOutlined />}
                                            onClick={() => removeFile(file.uid)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <Space.Compact style={{ width: '100%' }}>
                            <Upload
                                multiple
                                accept="image/*,.pdf,.txt,.doc,.docx"
                                beforeUpload={handleFileUpload}
                                showUploadList={false}
                            >
                                <Button icon={<PaperClipOutlined />} />
                            </Upload>
                            <TextArea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                disabled={isLoading}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSendMessage}
                                loading={isLoading}
                                disabled={!inputText.trim() && attachedFiles.length === 0}
                            />
                        </Space.Compact>
                    </div>
                </div>
            </Drawer>

            <style jsx>{`
        .chat-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .chat-toggle-btn {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .chat-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .message-item {
          border-bottom: none;
          padding: 8px 0;
        }

        .message-item.user {
          justify-content: flex-end;
        }

        .message-item.user .message-content {
          background: #1890ff;
          color: white;
          padding: 8px 12px;
          border-radius: 16px 16px 4px 16px;
          max-width: 280px;
        }

        .message-item.assistant .message-content {
          background: #f5f5f5;
          padding: 8px 12px;
          border-radius: 16px 16px 16px 4px;
          max-width: 280px;
        }

        .timestamp {
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .attached-files {
          margin-top: 8px;
        }

        .file-item {
          font-size: 12px;
          color: #666;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
        }

        .input-container {
          border-top: 1px solid #f0f0f0;
          padding: 16px;
        }

        .attached-files-preview {
          margin-bottom: 8px;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .chat-drawer {
            width: 100% !important;
          }
        }
      `}</style>
        </>
    );
}
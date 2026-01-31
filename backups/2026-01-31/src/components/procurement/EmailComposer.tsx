import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Textarea, Input, Label } from '@/components/ui'
import { Mail, Send } from 'lucide-react'
import { openGmailComposer } from '@/services/emailService'

interface EmailComposerProps {
    isOpen: boolean
    onClose: () => void
    initialData: {
        to: string
        subject: string
        body: string
    }
}

export function EmailComposer({ isOpen, onClose, initialData }: EmailComposerProps) {
    const [to, setTo] = useState(initialData.to)
    const [subject, setSubject] = useState(initialData.subject)
    const [body, setBody] = useState(initialData.body)

    // Update state when initialData changes
    React.useEffect(() => {
        if (isOpen) {
            setTo(initialData.to)
            setSubject(initialData.subject)
            setBody(initialData.body)
        }
    }, [isOpen, initialData])

    const handleSend = () => {
        openGmailComposer({ to, subject, body })
        // We could also log the "sent" action here if we had an API for it
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Compose Email (Gmail)
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="to" className="text-right">
                            To
                        </Label>
                        <Input
                            id="to"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="col-span-3"
                            placeholder="recipient@example.com"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                            Subject
                        </Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">
                            Message
                        </Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="min-h-[200px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} className="gap-2">
                        <Send className="w-4 h-4" />
                        Open in Gmail
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

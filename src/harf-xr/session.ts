// A single lifecycle owner: duplicate entry and failed starts cannot leak sessions.
export interface SessionLike {
    end(): Promise<void>;
    addEventListener(type: 'end', listener: () => void): void;
    removeEventListener(type: 'end', listener: () => void): void;
}
export class SessionOwner<T extends SessionLike> {
    current: T | null = null;
    starting = false;
    private ended: (() => void) | null = null;
    constructor(private attach: (session: T) => Promise<void>, private cleanup: () => void) { }
    async start(request: () => Promise<T>) {
        if (this.current || this.starting)
            return false;
        this.starting = true;
        let session: T | null = null;
        try {
            session = await request();
            this.current = session;
            this.ended = () => this.clear();
            session.addEventListener('end', this.ended);
            await this.attach(session);
            if (this.current !== session)
                throw Error('Session ended during startup');
            return true;
        }
        catch (error) {
            if (session) {
                try {
                    await session.end();
                }
                catch { /* Already ended. */ }
            }
            this.clear();
            throw error;
        }
        finally {
            this.starting = false;
        }
    }
    private clear() { if (this.current && this.ended)
        this.current.removeEventListener('end', this.ended); this.current = null; this.ended = null; this.cleanup(); }
    async stop() { if (this.current)
        await this.current.end(); }
}

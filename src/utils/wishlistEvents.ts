type Listener = () => void;

class EventEmitter {
  private listeners: Listener[] = [];
  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  emit() {
    this.listeners.forEach(l => l());
  }
}

export const wishlistEvents = new EventEmitter();


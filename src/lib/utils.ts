export function shorten(address: string, len = 4): string {
    if (!address) return "-";
    return address.slice(0, len) + "..." + address.slice(-len);
}

export function formatDate(timestamp: number): string {
    if (!timestamp) return "-";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

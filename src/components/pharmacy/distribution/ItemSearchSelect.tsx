import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Disc, Layers, AlertCircle, X } from 'lucide-react';
import { Input, Spinner, Badge } from '@/components/ui';
import { searchCatalogItems } from '@/services/pharmacy/unitCatalogItemService';
import { useAuth } from '@/hooks/useAuth';
import type { UnitCatalogItemWithRelations } from '@/types/pharmacy';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface ItemSearchSelectProps {
    onSelect: (item: UnitCatalogItemWithRelations) => void;
    placeholder?: string;
    catalogId?: string;
    itemType?: 'drug' | 'non_drug';
    className?: string;
}

const ItemSearchSelect: React.FC<ItemSearchSelectProps> = ({
    onSelect,
    placeholder = "Search items by name or code...",
    catalogId,
    itemType,
    className
}) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<UnitCatalogItemWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debouncedQuery.length >= 2 && user?.hospital_id) {
            handleSearch();
        } else {
            setResults([]);
        }
    }, [debouncedQuery, user?.hospital_id]);

    const handleSearch = async () => {
        if (!user?.hospital_id) return;
        setIsLoading(true);
        try {
            const response = await searchCatalogItems(
                user.hospital_id,
                debouncedQuery,
                itemType,
                catalogId
            );
            if (!response.error && response.data) {
                setResults(response.data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getItemDetails = (item: UnitCatalogItemWithRelations) => {
        if (item.drug) {
            return {
                code: item.drug.drug_code,
                name: item.drug.drug_name,
                specs: item.drug.strength || item.drug.dosage_form
            };
        }
        if (item.non_drug) {
            return {
                code: item.non_drug.item_code,
                name: item.non_drug.item_name,
                specs: null
            };
        }
        if (item.contract) {
            return {
                code: item.contract.item_code || 'N/A',
                name: item.contract.item_name,
                specs: item.contract.packaging_description
            };
        }
        if (item.appl_drug) {
            return {
                code: item.appl_drug.item_code,
                name: item.appl_drug.item_name,
                specs: null
            };
        }
        if (item.lp_drug) {
            return {
                code: item.lp_drug.item_code,
                name: item.lp_drug.item_name,
                specs: null
            };
        }
        return { code: 'N/A', name: 'Unknown Item', specs: null };
    };

    return (
        <div className={cn("relative w-full", className)} ref={dropdownRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isOpen && e.target.value.length >= 2) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (searchQuery.length >= 2) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className="pl-10 pr-10"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner size="sm" />
                    </div>
                )}
                {!isLoading && searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setResults([]);
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-red-500 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                )}
            </div>

            {isOpen && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                    {results.length > 0 ? (
                        <div className="py-2">
                            {results.map((item) => {
                                const details = getItemDetails(item);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onSelect(item);
                                            setSearchQuery('');
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                                    >
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-100/50 transition-colors">
                                            {item.drug || item.appl_drug || item.lp_drug ? (
                                                <Disc className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Package className="w-5 h-5 text-indigo-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-slate-900 line-clamp-1">{details.name}</span>
                                                <Badge variant="info" size="sm" className="font-mono text-[10px] uppercase">
                                                    {details.code}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                {details.specs && (
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <Layers className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{details.specs}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : !isLoading ? (
                        <div className="px-4 py-8 text-center bg-slate-50/50">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <AlertCircle className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-semibold mb-1">No items found</p>
                            <p className="text-slate-500 text-sm">We couldn't find any items matching "{searchQuery}"</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default ItemSearchSelect;

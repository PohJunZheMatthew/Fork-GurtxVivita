import { useState } from 'react';
import { useI18n } from '../i18n/i18n';
import { Material, FloorData } from '../types';
import { RoomMap } from './RoomMap';
import { styles } from './Userviewstyles';

interface MapViewProps {
    floors: FloorData[];
    materials: Material[];
}

// Map-only half of the old combined UserView. No tab switcher, no
// materials/request state — this is the entire content of the "Map" tab.
export function MapView({ floors, materials }: MapViewProps) {
    const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);
    const { t } = useI18n();

    return (
        <div style={styles.container}>
            <div style={styles.mapWrapper}>
                <div style={styles.absoluteFill}>
                    <RoomMap
                        floors={floors}
                        materials={materials}
                        selectedCompartment={selectedCompartment}
                        onCompartmentClick={setSelectedCompartment}
                        isAdmin={false}
                    />
                </div>

                {!selectedCompartment && (
                    <div style={styles.hint}>
                        {t('user.hint')}
                    </div>
                )}
            </div>
        </div>
    );
}
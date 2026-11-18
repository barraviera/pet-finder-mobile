import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    getSighting,
    resolveSighting,
    flagSighting,
} from '@/services/sightingService';

import { getImageUrl } from '@/services/api';

import type { SightingResponse } from '@/types/sighting';

import { useAuth } from '@/contexts/AuthContext';

export default function SightingDetailsScreen() {
    // Recupera o ID enviado pela rota
    const { id } = useLocalSearchParams<{ id: string }>();

    // Estado da ocorrência
    const [sighting, setSighting] = useState<SightingResponse | null>(null);

    // Estados de carregamento e erro
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    const [resolving, setResolving] = useState(false);

    // Estados da denúncia
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);

    // Observe que usamos sighting?.reporterId, pois a ocorrência começa como null e só recebe os dados depois da resposta da API.
    const canResolve =
        user?.id === sighting?.reporterId ||
        user?.role === 'ADMIN';

    // Isso impede que o botão seja exibido para o autor da ocorrência.
    const canFlag = user?.id !== sighting?.reporterId;

    // Busca os detalhes da ocorrência
    useEffect(() => {
        async function loadSighting() {
            try {
                setError(null);

                const data = await getSighting(id);
                setSighting(data);

            } catch (err) {
                console.error('Erro ao carregar ocorrência:', err);
                setError('Não foi possível carregar os detalhes da ocorrência.');

            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadSighting();
        }
    }, [id]);

    // Carregamento
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#23834D" />
                <Text style={styles.loadingText}>
                    Carregando detalhes...
                </Text>
            </View>
        );
    }

    // Erro ou ocorrência não encontrada
    if (error || !sighting) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>
                    {error ?? 'Ocorrência não encontrada.'}
                </Text>

                <Text
                    style={styles.backLink}
                    onPress={() => router.back()}
                >
                    Voltar
                </Text>
            </View>
        );
    }

    // Função para resolver a ocorrência
    async function handleResolveSighting() {
        try {
            setResolving(true);

            const updatedSighting = await resolveSighting(id);

            setSighting(updatedSighting);

            Alert.alert(
                'Ocorrência resolvida!',
                'O status do avistamento foi atualizado.',
            );

        } catch (err) {
            console.error('Erro ao resolver ocorrência:', err);

            Alert.alert(
                'Erro',
                'Não foi possível resolver a ocorrência.',
            );

        } finally {
            setResolving(false);
        }
    }

    // Função para denunciar a ocorrência
    // Quando o campo estiver vazio, enviamos undefined. A função flagSighting já transforma isso em {}, respeitando o contrato do backend.
    async function handleFlagSighting() {
        try {
            setReporting(true);

            const reason = reportReason.trim();

            await flagSighting(id, reason || undefined);

            setReportModalVisible(false);
            setReportReason('');

            Alert.alert(
                'Denúncia enviada',
                'Obrigado por ajudar a manter o PetFinder seguro.',
            );

        } catch (err: any) {
            console.error('Erro ao denunciar ocorrência:', err);

            const status = err.response?.status;

            if (status === 400) {
                Alert.alert(
                    'Não permitido',
                    'Você não pode denunciar sua própria ocorrência.',
                );
            } else if (status === 404) {
                Alert.alert(
                    'Não encontrado',
                    'Essa ocorrência não existe mais.',
                );
            } else if (status === 409) {
                Alert.alert(
                    'Denúncia duplicada',
                    'Você já denunciou essa ocorrência.',
                );
            } else {
                Alert.alert(
                    'Erro',
                    'Não foi possível enviar a denúncia. Tente novamente.',
                );
            }

        } finally {
            setReporting(false);
        }
    }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text
                        style={styles.backLink}
                        onPress={() => router.back()}
                    >
                        ‹ Voltar
                    </Text>

                    <Text style={styles.title}>
                        Detalhes da ocorrência
                    </Text>
                </View>

                {/* Fotos */}
                {sighting.photoUrls.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.photoList}
                    >
                        {sighting.photoUrls.map((photo, index) => (
                            <Image
                                key={`${photo}-${index}`}
                                source={{ uri: getImageUrl(photo) }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noPhoto}>
                        <Text style={styles.noPhotoText}>
                            Sem fotos disponíveis
                        </Text>
                    </View>
                )}

                {/* Informações */}
                <View style={styles.content}>
                    <Text style={styles.species}>
                        {sighting.species} · {sighting.color}
                    </Text>

                    <Text style={styles.description}>
                        {sighting.description}
                    </Text>

                    <View style={styles.infoGroup}>
                        <Text style={styles.label}>Nome do animal</Text>
                        <Text style={styles.value}>
                            {sighting.petName ?? 'Não informado'}
                        </Text>
                    </View>

                    <View style={styles.infoGroup}>
                        <Text style={styles.label}>Porte</Text>
                        <Text style={styles.value}>
                            {sighting.size ?? 'Não informado'}
                        </Text>
                    </View>

                    <View style={styles.infoGroup}>
                        <Text style={styles.label}>Localização</Text>
                        <Text style={styles.value}>
                            {sighting.address ?? 'Endereço não informado'}
                        </Text>
                    </View>

                    <View style={styles.infoGroup}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={styles.status}>
                            {sighting.status === 'OPEN'
                                ? 'Em aberto'
                                : sighting.status}
                        </Text>
                    </View>

                    <View style={styles.infoGroup}>
                        <Text style={styles.label}>Data do avistamento</Text>
                        <Text style={styles.value}>
                            {new Date(sighting.createdAt).toLocaleDateString('pt-BR')}
                        </Text>
                    </View>

                    {canResolve && sighting.status === 'OPEN' && (
                        <Pressable
                            style={styles.resolveButton}
                            onPress={handleResolveSighting}
                            disabled={resolving}
                        >
                            <Text style={styles.resolveButtonText}>
                                {resolving
                                    ? 'Resolvendo...'
                                    : 'Marcar como resolvido'}
                            </Text>
                        </Pressable>
                    )}

                    {canFlag && (
                        <Pressable
                            style={styles.flagButton}
                            onPress={() => setReportModalVisible(true)}
                        >
                            <Text style={styles.flagButtonText}>
                                Denunciar ocorrência
                            </Text>
                        </Pressable>
                    )}

                </View>
            </ScrollView>

            <Modal
                visible={reportModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setReportModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        <Text style={styles.modalTitle}>
                            Denunciar ocorrência
                        </Text>

                        <Text style={styles.modalDescription}>
                            Informe o motivo da denúncia (opcional).
                        </Text>

                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Ex.: anúncio duplicado ou informação suspeita"
                            multiline
                            numberOfLines={4}
                            value={reportReason}
                            onChangeText={setReportReason}
                            textAlignVertical="top"
                        />

                        <Pressable
                            style={styles.submitFlagButton}
                            onPress={handleFlagSighting}
                            disabled={reporting}
                        >
                            <Text style={styles.submitFlagButtonText}>
                                {reporting ? 'Enviando...' : 'Enviar denúncia'}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => setReportModalVisible(false)}
                            disabled={reporting}
                        >
                            <Text style={styles.cancelButtonText}>
                                Cancelar
                            </Text>
                        </Pressable>

                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8F5',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F5F8F5',
    },

    loadingText: {
        marginTop: 12,
        color: '#66736A',
    },

    errorText: {
        color: '#C0392B',
        textAlign: 'center',
        marginBottom: 16,
    },

    header: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        paddingTop: 55,
    },

    backLink: {
        color: '#23834D',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#26352B',
    },

    photoList: {
        marginTop: 16,
    },

    photo: {
        width: 320,
        height: 260,
        borderRadius: 12,
        marginHorizontal: 8,
    },

    noPhoto: {
        height: 180,
        backgroundColor: '#E8EFEA',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 16,
        borderRadius: 12,
    },

    noPhotoText: {
        color: '#78827B',
    },

    content: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        margin: 16,
        borderRadius: 14,
    },

    species: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#23834D',
        marginBottom: 12,
    },

    description: {
        fontSize: 18,
        fontWeight: '600',
        color: '#26352B',
        marginBottom: 20,
    },

    infoGroup: {
        marginBottom: 18,
    },

    label: {
        fontSize: 12,
        color: '#89938B',
        marginBottom: 5,
    },

    value: {
        fontSize: 15,
        color: '#26352B',
    },

    status: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#23834D',
    },

    resolveButton: {
        backgroundColor: '#23834D',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },

    resolveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },

    flagButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#C0392B',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
    },

    flagButtonText: {
        color: '#C0392B',
        fontSize: 15,
        fontWeight: 'bold',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },

    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#26352B',
        marginBottom: 10,
    },

    modalDescription: {
        fontSize: 14,
        color: '#66736A',
        marginBottom: 16,
    },

    reasonInput: {
        minHeight: 110,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        marginBottom: 18,
    },

    submitFlagButton: {
        backgroundColor: '#C0392B',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },

    submitFlagButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    cancelButton: {
        padding: 14,
        alignItems: 'center',
        marginTop: 6,
    },

    cancelButtonText: {
        color: '#66736A',
        fontWeight: '600',
    },
});

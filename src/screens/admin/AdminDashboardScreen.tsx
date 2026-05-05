import { useState, useEffect, useCallback } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "../../components/ui/AppText";
import AppHeader from "../../components/ui/AppHeader";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboard, DashboardStats, fetchCostSettings, updateCostSettings, CostSettings } from "../../services/adminApi";

export default function AdminDashboardScreen({ navigation }: any) {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Cost settings
    const [costSettings, setCostSettings] = useState<CostSettings>({
        input_cost_per_million: 2,
        output_cost_per_million: 12,
        usd_to_inr: 83.5,
        per_image_cost: 10,
    });
    const [editInputCost, setEditInputCost] = useState("");
    const [editOutputCost, setEditOutputCost] = useState("");
    const [editUsdToInr, setEditUsdToInr] = useState("");
    const [editPerImageCost, setEditPerImageCost] = useState("");
    const [savingSettings, setSavingSettings] = useState(false);

    const loadDashboard = useCallback(async () => {
        try {
            const [data, settings] = await Promise.all([
                fetchDashboard(),
                fetchCostSettings(),
            ]);
            setStats(data);
            setCostSettings(settings);
            setEditInputCost(settings.input_cost_per_million.toString());
            setEditOutputCost(settings.output_cost_per_million.toString());
            setEditUsdToInr(settings.usd_to_inr.toString());
            setEditPerImageCost((settings.per_image_cost || 10).toString());
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const handleSaveSettings = async () => {
        const inputVal = parseFloat(editInputCost);
        const outputVal = parseFloat(editOutputCost);
        const inrVal = parseFloat(editUsdToInr);
        const perImageVal = parseFloat(editPerImageCost);

        if (isNaN(inputVal) || isNaN(outputVal) || isNaN(inrVal) || isNaN(perImageVal)) {
            Alert.alert("Invalid Input", "Please enter valid numbers for all fields.");
            return;
        }
        if (inputVal <= 0 || outputVal <= 0 || inrVal <= 0 || perImageVal <= 0) {
            Alert.alert("Invalid Input", "All values must be greater than zero.");
            return;
        }

        setSavingSettings(true);
        try {
            await updateCostSettings({
                input_cost_per_million: inputVal,
                output_cost_per_million: outputVal,
                usd_to_inr: inrVal,
                per_image_cost: perImageVal,
            });
            setCostSettings({
                input_cost_per_million: inputVal,
                output_cost_per_million: outputVal,
                usd_to_inr: inrVal,
                per_image_cost: perImageVal,
            });
            Alert.alert("Saved", "Cost settings updated successfully.");
        } catch (err) {
            Alert.alert("Error", "Failed to save settings.");
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    const s = stats;

    return (
        <View style={styles.container}>
            <AppHeader title="Brand Shoot Admin" />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Welcome Row */}
                    <View style={styles.welcomeRow}>
                        <View style={styles.welcomeText}>
                            <AppText style={styles.greeting}>Welcome back,</AppText>
                            <AppText style={styles.adminName}>{user?.name ?? "Admin"}</AppText>
                        </View>
                        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>

                    {/* ── User Stats ──────────────────────────────────────────── */}
                    <AppText style={styles.sectionTitle}>Users</AppText>
                    <View style={styles.cardRow}>
                        <StatCard icon="people" label="Total Users" value={s?.users.total ?? 0} color={theme.colors.accent} />
                        <StatCard icon="checkmark-circle" label="Active Status" value={s?.users.active ?? 0} color={theme.colors.success} />
                    </View>
                    <View style={styles.cardRow}>
                        <StatCard icon="ban" label="Suspended" value={s?.users.suspended ?? 0} color={theme.colors.error} />
                        <StatCard icon="person-add" label="New (7d)" value={s?.users.new_this_week ?? 0} color="#3B82F6" />
                    </View>

                    {/* ── Generation Stats ─────────────────────────────────── */}
                    <AppText style={styles.sectionTitle}>Generations</AppText>
                    <View style={styles.cardRow}>
                        <StatCard icon="images" label="Total" value={s?.generations.total ?? 0} color={theme.colors.accent} />
                        <StatCard icon="calendar" label="This Month" value={s?.generations.this_month ?? 0} color="#8B5CF6" />
                    </View>

                    {/* ── Token Usage ──────────────────────────────────────── */}
                    <AppText style={styles.sectionTitle}>Token Usage (All Time)</AppText>
                    <View style={styles.tokenCard}>
                        <View style={styles.tokenRow}>
                            <View style={styles.tokenItem}>
                                <AppText style={styles.tokenValue}>{formatNumber(s?.tokens.total_tokens ?? 0)}</AppText>
                                <AppText style={styles.tokenLabel}>Total Tokens</AppText>
                            </View>
                            <View style={styles.tokenDivider} />
                            <View style={styles.tokenItem}>
                                <AppText style={styles.tokenValue}>{formatNumber(s?.tokens.total_images ?? 0)}</AppText>
                                <AppText style={styles.tokenLabel}>Images</AppText>
                            </View>
                        </View>
                        <View style={styles.tokenBreakdown}>
                            <View style={styles.tokenSmall}>
                                <Ionicons name="arrow-up-outline" size={14} color={theme.colors.success} />
                                <AppText style={styles.tokenSmallText}>Input: {formatNumber(s?.tokens.total_input_tokens ?? 0)}</AppText>
                            </View>
                            <View style={styles.tokenSmall}>
                                <Ionicons name="arrow-down-outline" size={14} color="#3B82F6" />
                                <AppText style={styles.tokenSmallText}>Output: {formatNumber(s?.tokens.total_output_tokens ?? 0)}</AppText>
                            </View>
                        </View>
                    </View>

                    {/* ── Cost Settings (Editable) ────────────────────────── */}
                    <AppText style={styles.sectionTitle}>Cost Configuration</AppText>
                    <View style={styles.settingsCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelWrap}>
                                <Ionicons name="arrow-up-circle-outline" size={16} color={theme.colors.success} />
                                <AppText style={styles.settingLabel}>Input Cost ($ / 1M tokens)</AppText>
                            </View>
                            <TextInput
                                style={styles.settingInput}
                                value={editInputCost}
                                onChangeText={setEditInputCost}
                                keyboardType="decimal-pad"
                                placeholder="2"
                                placeholderTextColor={theme.colors.muted}
                            />
                        </View>

                        <View style={styles.settingDivider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelWrap}>
                                <Ionicons name="arrow-down-circle-outline" size={16} color="#3B82F6" />
                                <AppText style={styles.settingLabel}>Output Cost ($ / 1M tokens)</AppText>
                            </View>
                            <TextInput
                                style={styles.settingInput}
                                value={editOutputCost}
                                onChangeText={setEditOutputCost}
                                keyboardType="decimal-pad"
                                placeholder="12"
                                placeholderTextColor={theme.colors.muted}
                            />
                        </View>

                        <View style={styles.settingDivider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelWrap}>
                                <Ionicons name="swap-horizontal-outline" size={16} color={theme.colors.accent} />
                                <AppText style={styles.settingLabel}>USD → INR Rate</AppText>
                            </View>
                            <TextInput
                                style={styles.settingInput}
                                value={editUsdToInr}
                                onChangeText={setEditUsdToInr}
                                keyboardType="decimal-pad"
                                placeholder="83.5"
                                placeholderTextColor={theme.colors.muted}
                            />
                        </View>

                        <View style={styles.settingDivider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelWrap}>
                                <Ionicons name="cash-outline" size={16} color="#10B981" />
                                <AppText style={styles.settingLabel}>Per Image Cost (₹)</AppText>
                            </View>
                            <TextInput
                                style={styles.settingInput}
                                value={editPerImageCost}
                                onChangeText={setEditPerImageCost}
                                keyboardType="decimal-pad"
                                placeholder="10"
                                placeholderTextColor={theme.colors.muted}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, savingSettings && styles.saveBtnDisabled]}
                            onPress={handleSaveSettings}
                            disabled={savingSettings}
                            activeOpacity={0.8}
                        >
                            {savingSettings ? (
                                <ActivityIndicator size="small" color={theme.colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.white} />
                                    <AppText style={styles.saveBtnText}>Save Settings</AppText>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ── Quick Actions ──────────────────────────────────── */}
                    <AppText style={styles.sectionTitle}>Quick Actions</AppText>
                    <View style={styles.actionsGrid}>
                        <ActionCard
                            icon="people-outline"
                            label="Manage Users"
                            subtitle="View & edit all users"
                            onPress={() => navigation.navigate("AdminUsers")}
                        />
                        <ActionCard
                            icon="stats-chart-outline"
                            label="Token Analytics"
                            subtitle="Usage breakdown"
                            onPress={() => navigation.navigate("AdminTokenStats")}
                        />
                    </View>

                    {/* ── Content Management ─────────────────────────────── */}
                    <AppText style={styles.sectionTitle}>Content Management</AppText>

                    <View style={styles.actionsGrid}>
                        <ActionCard
                            icon="grid-outline"
                            label="Categories"
                            subtitle="Jewelry, Fashion, etc."
                            onPress={() => navigation.navigate("AdminCategories")}
                        />
                        <ActionCard
                            icon="body-outline"
                            label="App Models"
                            subtitle="AI Characters"
                            onPress={() => navigation.navigate("AdminModels")}
                        />
                    </View>

                    <View style={[styles.actionsGrid, { marginTop: 12 }]}>
                        <ActionCard
                            icon="color-palette-outline"
                            label="Backgrounds"
                            subtitle="Colors & Textures"
                            onPress={() => navigation.navigate("AdminBackgrounds")}
                        />
                        {/* <ActionCard
                            icon="text-outline"
                            label="Prompts"
                            subtitle="System & Styles"
                            onPress={() => navigation.navigate("AdminPrompts")}
                        /> */}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: color + "15" }]}>
                <Ionicons name={icon as any} size={22} color={color} />
            </View>
            <AppText style={styles.statValue}>{formatNumber(value)}</AppText>
            <AppText style={styles.statLabel}>{label}</AppText>
        </View>
    );
}

function ActionCard({ icon, label, subtitle, onPress }: { icon: string; label: string; subtitle: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.actionIconWrap}>
                <Ionicons name={icon as any} size={24} color={theme.colors.accent} />
            </View>
            <AppText style={styles.actionLabel}>{label}</AppText>
            <AppText style={styles.actionSubtitle}>{subtitle}</AppText>
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { justifyContent: "center", alignItems: "center" },
    content: { padding: theme.spacing.screenPadding, paddingBottom: theme.spacing.xl },

    welcomeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: theme.spacing.lg,
    },
    welcomeText: { flex: 1 },
    greeting: { ...theme.typography.body, color: theme.colors.secondary },
    adminName: { ...theme.typography.title, color: theme.colors.primary, fontSize: 20 },
    logoutBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: theme.colors.error + "12",
        justifyContent: "center", alignItems: "center",
    },

    sectionTitle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
        fontWeight: "700",
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },

    cardRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        alignItems: "flex-start",
        gap: theme.spacing.xs,
    },
    statIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: "center", alignItems: "center",
        marginBottom: theme.spacing.xs,
    },
    statValue: { ...theme.typography.title, color: theme.colors.primary, fontSize: 22 },
    statLabel: { ...theme.typography.caption, color: theme.colors.secondary },

    tokenCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },
    tokenRow: { flexDirection: "row", alignItems: "center" },
    tokenItem: { flex: 1, alignItems: "center" },
    tokenValue: { ...theme.typography.title, color: theme.colors.primary, fontSize: 20 },
    tokenLabel: { ...theme.typography.caption, color: theme.colors.secondary, marginTop: 2 },
    tokenDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },
    tokenBreakdown: {
        flexDirection: "row", justifyContent: "center", gap: theme.spacing.lg,
        marginTop: theme.spacing.md, paddingTop: theme.spacing.sm,
        borderTopWidth: 1, borderColor: theme.colors.border,
    },
    tokenSmall: { flexDirection: "row", alignItems: "center", gap: 4 },
    tokenSmallText: { ...theme.typography.caption, color: theme.colors.secondary },

    // ── Cost Settings ──────────────────────────────────────────────────────────
    settingsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.sm,
    },
    settingLabelWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flex: 1,
    },
    settingLabel: {
        ...theme.typography.body,
        color: theme.colors.secondary,
        fontSize: 12,
    },
    settingInput: {
        width: 80,
        height: 36,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        textAlign: "center",
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
        fontWeight: "700",
        fontSize: 13,
        padding: 0,
    },
    settingDivider: {
        height: 1,
        backgroundColor: theme.colors.border,
    },
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.accent,
        borderRadius: theme.radius.md,
        paddingVertical: 10,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
        fontWeight: "700",
        fontSize: 13,
    },

    actionsGrid: { flexDirection: "row", gap: theme.spacing.sm },
    actionCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    actionIconWrap: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: theme.colors.accentLight,
        justifyContent: "center", alignItems: "center",
        marginBottom: theme.spacing.xs,
    },
    actionLabel: { ...theme.typography.bodyMedium, color: theme.colors.primary, fontWeight: "700" },
    actionSubtitle: { ...theme.typography.caption, color: theme.colors.secondary },
});

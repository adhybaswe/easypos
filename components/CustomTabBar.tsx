import { theme } from '@/constants/theme';
import { useConfigStore } from '@/stores/useConfigStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable, Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    useConfigStore(); // Subscribe to language/config changes

    return (
        <View style={styles.container}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                let iconName: keyof typeof Ionicons.glyphMap = 'home';
                if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
                if (route.name === 'settings') iconName = isFocused ? 'settings' : 'settings-outline';

                return (
                    <PlatformPressable
                        key={route.key}
                        href={undefined}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={[styles.tabItem, isFocused && styles.tabItemFocused]}
                    >
                        <Ionicons
                            name={iconName}
                            size={24}
                            color={isFocused ? theme.colors.white : theme.colors.textSecondary}
                        />
                        <Text style={[styles.label, { color: isFocused ? theme.colors.white : theme.colors.textSecondary }]}>
                            {typeof label === 'string' ? label : route.name}
                        </Text>
                    </PlatformPressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: theme.colors.card,
        borderRadius: 25,
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-around',
        ...theme.shadows.medium,
        borderCurve: 'continuous',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        borderRadius: 25,
        marginHorizontal: 4,
        gap: 4,
    },
    tabItemFocused: {
        backgroundColor: theme.colors.primary,
        transform: [{ scale: 1.05 }],
    },
    label: {
        fontSize: 10, // Small text for tab labels
        fontWeight: '600',
    }
});

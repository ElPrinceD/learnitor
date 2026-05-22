import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { ListRenderItemInfo } from "react-native";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import debounce from "lodash.debounce";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import {
  Institution,
  searchInstitutions,
} from "../../services/SignupApiCalls";

const ROW_HEIGHT = rV(52);
const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  onSelect: (institution: Institution) => void;
}

export interface InstitutionPickerSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface RowProps {
  item: Institution;
  onPress: (item: Institution) => void;
}

const InstitutionRow = memo(({ item, onPress }: RowProps) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  const subtitle = [item.city, item.country].filter(Boolean).join(", ");

  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        { borderBottomColor: themeColors.border + "30" },
      ]}
      onPress={handlePress}
      activeOpacity={0.65}
    >
      <Text
        style={[rowStyles.name, { color: themeColors.text }]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {subtitle ? (
        <Text
          style={[rowStyles.sub, { color: themeColors.textSecondary }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
});

const rowStyles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: rS(20),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontSize: rMS(14),
    fontWeight: "700",
  },
  sub: {
    fontSize: rMS(11),
    fontWeight: "500",
    marginTop: 2,
  },
});

const InstitutionPickerSheet = forwardRef<InstitutionPickerSheetRef, Props>(
  ({ onSelect }, ref) => {
    const sheetRef = React.useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? "light"];

    const listBottomInset = useMemo(
      () => Math.max(insets.bottom, rV(16)) + rV(56),
      [insets.bottom]
    );

    const [searchText, setSearchText] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");

    const debouncedSetQ = useMemo(
      () =>
        debounce((text: string) => {
          setDebouncedQ(text.trim());
        }, SEARCH_DEBOUNCE_MS),
      []
    );

    useEffect(() => {
      debouncedSetQ(searchText);
      return () => debouncedSetQ.cancel();
    }, [searchText, debouncedSetQ]);

    React.useImperativeHandle(ref, () => ({
      present: () => {
        setSearchText("");
        setDebouncedQ("");
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const queryEnabled =
      debouncedQ.length === 0 || debouncedQ.length >= 2;

    const {
      data,
      isLoading,
      isFetching,
      isError,
      refetch,
    } = useQuery({
      queryKey: ["institutions", debouncedQ],
      queryFn: ({ signal }) => searchInstitutions(debouncedQ, 30, 0, signal),
      enabled: queryEnabled,
      placeholderData: keepPreviousData,
      staleTime: 5 * 60_000,
    });

    const results = data?.results ?? [];
    const showHint =
      searchText.trim().length > 0 && searchText.trim().length < 2;

    const snapPoints = useMemo(() => ["75%", "90%"], []);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleSelect = useCallback(
      (institution: Institution) => {
        onSelect(institution);
        sheetRef.current?.dismiss();
      },
      [onSelect]
    );

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<Institution>) => (
        <InstitutionRow item={item} onPress={handleSelect} />
      ),
      [handleSelect]
    );

    const keyExtractor = useCallback(
      (item: Institution) => String(item.id),
      []
    );

    const listFooter = useMemo(
      () => <View style={{ height: listBottomInset }} />,
      [listBottomInset]
    );

    const styles = StyleSheet.create({
      header: {
        paddingHorizontal: rS(20),
        paddingTop: rV(4),
        paddingBottom: rV(12),
      },
      title: {
        fontSize: rMS(18),
        fontWeight: "800",
        color: themeColors.text,
        marginBottom: rV(10),
      },
      search: {
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: rMS(12),
        paddingHorizontal: rS(14),
        paddingVertical: rV(10),
        fontSize: rMS(14),
        color: themeColors.text,
        backgroundColor: themeColors.background,
      },
      hint: {
        fontSize: rMS(12),
        color: themeColors.textSecondary,
        marginTop: rV(8),
        fontWeight: "500",
      },
      listContainer: {
        flex: 1,
        minHeight: rV(280),
      },
      center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: rV(40),
      },
      emptyText: {
        fontSize: rMS(14),
        color: themeColors.textSecondary,
        fontWeight: "600",
      },
      retry: {
        marginTop: rV(12),
        paddingHorizontal: rS(16),
        paddingVertical: rV(8),
      },
      retryText: {
        color: themeColors.tint,
        fontWeight: "700",
        fontSize: rMS(13),
      },
    });

    const listEmpty = useMemo(() => {
      if (showHint) {
        return (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Type at least 2 characters</Text>
          </View>
        );
      }
      if (isLoading || isFetching) {
        return (
          <View style={styles.center}>
            <ActivityIndicator color={themeColors.tint} />
          </View>
        );
      }
      if (isError) {
        return (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Could not load schools</Text>
            <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No schools found</Text>
        </View>
      );
    }, [
      showHint,
      isLoading,
      isFetching,
      isError,
      themeColors.tint,
      refetch,
      styles,
    ]);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        bottomInset={insets.bottom}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: themeColors.background,
          borderRadius: rMS(28),
        }}
        handleIndicatorStyle={{
          backgroundColor: themeColors.textSecondary + "50",
          width: rS(40),
        }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetFlatList
          data={queryEnabled ? results : []}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Select your school</Text>
              <BottomSheetTextInput
                style={styles.search}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search schools..."
                placeholderTextColor={themeColors.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {showHint ? (
                <Text style={styles.hint}>Type at least 2 characters to search</Text>
              ) : null}
            </View>
          }
          ListFooterComponent={listFooter}
          ListEmptyComponent={listEmpty}
          showsVerticalScrollIndicator
          contentContainerStyle={{ paddingBottom: listBottomInset }}
        />
      </BottomSheetModal>
    );
  }
);

InstitutionPickerSheet.displayName = "InstitutionPickerSheet";

export default memo(InstitutionPickerSheet);

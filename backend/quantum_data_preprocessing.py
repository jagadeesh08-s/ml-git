# Quantum Data Preprocessing Techniques for Bloch Verse
# Python implementation of advanced preprocessing methods optimized for quantum machine learning
# Converted from TypeScript quantumDataPreprocessing.ts

import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass
import math
import random


@dataclass
class DataSample:
    features: List[float]
    label: Optional[int] = None
    target: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class PreprocessingConfig:
    normalization: str = 'zscore'  # 'none' | 'minmax' | 'zscore' | 'robust'
    encoding: str = 'angle'  # 'raw' | 'angle' | 'amplitude' | 'basis'
    dimensionality: Dict[str, Any] = None
    augmentation: Dict[str, Any] = None
    validation: Dict[str, Any] = None

    def __post_init__(self):
        if self.dimensionality is None:
            self.dimensionality = {
                'reduction': 'none'
            }
        if self.augmentation is None:
            self.augmentation = {
                'enabled': False,
                'noise': 0.1,
                'rotations': False,
                'permutations': False
            }
        if self.validation is None:
            self.validation = {
                'train_split': 0.8,
                'stratify': True,
                'shuffle': True
            }


class QuantumDataPreprocessor:
    """Advanced data preprocessor optimized for quantum machine learning"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = PreprocessingConfig(**(config or {}))
        self.statistics: Dict[str, List[float]] = {}

    def fit(self, data: List[DataSample]) -> None:
        """Fit preprocessor on training data"""
        features = [sample.features for sample in data]

        # Calculate statistics for normalization
        self._calculate_statistics(features)

        # Fit dimensionality reduction if needed
        if self.config.dimensionality['reduction'] != 'none':
            self._fit_dimensionality_reduction(features)

    def transform(self, data: List[DataSample]) -> List[DataSample]:
        """Transform data using fitted preprocessor"""
        processed_data = data.copy()

        # Apply normalization
        processed_data = self._apply_normalization(processed_data)

        # Apply dimensionality reduction
        processed_data = self._apply_dimensionality_reduction(processed_data)

        # Apply quantum-specific encoding
        processed_data = self._apply_encoding(processed_data)

        return processed_data

    def fit_transform(self, data: List[DataSample]) -> List[DataSample]:
        """Fit and transform in one step"""
        self.fit(data)
        return self.transform(data)

    def split_data(self, data: List[DataSample]) -> Tuple[List[DataSample], List[DataSample]]:
        """Split data into train/validation sets"""
        train_split = self.config.validation['train_split']
        stratify = self.config.validation['stratify']
        shuffle = self.config.validation['shuffle']

        processed_data = data.copy()

        # Shuffle if requested
        if shuffle:
            random.shuffle(processed_data)

        # Stratified split if requested and labels are available
        if stratify and any(sample.label is not None for sample in data):
            return self._stratified_split(processed_data, train_split)
        else:
            split_index = int(len(processed_data) * train_split)
            return processed_data[:split_index], processed_data[split_index:]

    def augment_data(self, data: List[DataSample], num_augmentations: int = 1) -> List[DataSample]:
        """Generate augmented data samples"""
        if not self.config.augmentation['enabled']:
            return data

        augmented_data = []

        for sample in data:
            # Add original sample
            augmented_data.append(DataSample(
                features=sample.features.copy(),
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            ))

            # Generate augmentations
            for _ in range(num_augmentations):
                augmented = self._augment_sample(sample)
                augmented_data.append(augmented)

        return augmented_data

    def _calculate_statistics(self, features: List[List[float]]) -> None:
        """Calculate statistics for normalization"""
        if not features:
            return

        num_features = len(features[0])
        num_samples = len(features)

        # Initialize arrays
        self.statistics['mean'] = [0.0] * num_features
        self.statistics['std'] = [0.0] * num_features
        self.statistics['min'] = [float('inf')] * num_features
        self.statistics['max'] = [float('-inf')] * num_features
        self.statistics['median'] = [0.0] * num_features
        self.statistics['mad'] = [0.0] * num_features

        # Calculate mean and min/max
        for sample in features:
            for j in range(num_features):
                value = sample[j]
                self.statistics['mean'][j] += value
                self.statistics['min'][j] = min(self.statistics['min'][j], value)
                self.statistics['max'][j] = max(self.statistics['max'][j], value)

        for j in range(num_features):
            self.statistics['mean'][j] /= num_samples

        # Calculate standard deviation and median
        for j in range(num_features):
            values = [sample[j] for sample in features]
            values.sort()

            # Standard deviation
            variance = sum((sample[j] - self.statistics['mean'][j]) ** 2 for sample in features) / num_samples
            self.statistics['std'][j] = math.sqrt(variance)

            # Median
            self.statistics['median'][j] = (
                values[num_samples // 2] if num_samples % 2 == 1
                else (values[num_samples // 2 - 1] + values[num_samples // 2]) / 2
            )

            # MAD (Median Absolute Deviation)
            deviations = [abs(v - self.statistics['median'][j]) for v in values]
            deviations.sort()
            self.statistics['mad'][j] = deviations[num_samples // 2]

    def _apply_normalization(self, data: List[DataSample]) -> List[DataSample]:
        """Apply normalization to data"""
        if self.config.normalization == 'none':
            return data

        return [
            DataSample(
                features=self._normalize_features(sample.features),
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            )
            for sample in data
        ]

    def _normalize_features(self, features: List[float]) -> List[float]:
        """Normalize a single feature vector"""
        normalized = features.copy()

        for i in range(len(normalized)):
            value = normalized[i]

            if self.config.normalization == 'minmax':
                min_val = self.statistics['min'][i]
                max_val = self.statistics['max'][i]
                if max_val != min_val:
                    normalized[i] = (value - min_val) / (max_val - min_val)

            elif self.config.normalization == 'zscore':
                mean_val = self.statistics['mean'][i]
                std_val = self.statistics['std'][i]
                if std_val != 0:
                    normalized[i] = (value - mean_val) / std_val

            elif self.config.normalization == 'robust':
                median_val = self.statistics['median'][i]
                mad_val = self.statistics['mad'][i]
                if mad_val != 0:
                    normalized[i] = (value - median_val) / mad_val

        return normalized

    def _fit_dimensionality_reduction(self, features: List[List[float]]) -> None:
        """Fit dimensionality reduction"""
        reduction = self.config.dimensionality['reduction']

        if reduction == 'pca':
            self._fit_pca(features, self.config.dimensionality.get('target_dimensions', 2))
        elif reduction == 'autoencoder':
            pass  # Would implement autoencoder-based reduction
        elif reduction == 'feature_selection':
            self._fit_feature_selection(features, self.config.dimensionality.get('target_dimensions', 2))

    def _apply_dimensionality_reduction(self, data: List[DataSample]) -> List[DataSample]:
        """Apply dimensionality reduction"""
        reduction = self.config.dimensionality['reduction']

        if reduction == 'none':
            return data

        if reduction == 'pca':
            return self._apply_pca(data)
        elif reduction == 'autoencoder':
            return self._apply_autoencoder_reduction(data)
        elif reduction == 'feature_selection':
            return self._apply_feature_selection(data)

        return data

    def _fit_pca(self, features: List[List[float]], target_dimensions: int) -> None:
        """Fit PCA (simplified implementation)"""
        # This is a simplified PCA - in practice would use proper eigenvector calculation
        num_features = len(features[0])
        self.statistics['pca_components'] = list(range(min(target_dimensions, num_features)))

    def _apply_pca(self, data: List[DataSample]) -> List[DataSample]:
        """Apply PCA reduction"""
        selected_dims = self.statistics.get('pca_components', [])
        return [
            DataSample(
                features=[sample.features[i] for i in selected_dims],
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            )
            for sample in data
        ]

    def _fit_feature_selection(self, features: List[List[float]], target_dimensions: int) -> None:
        """Fit feature selection based on variance"""
        num_features = len(features[0])

        variances = []
        for i in range(num_features):
            values = [sample[i] for sample in features]
            mean_val = sum(values) / len(values)
            variance = sum((v - mean_val) ** 2 for v in values) / len(values)
            variances.append((i, variance))

        variances.sort(key=lambda x: x[1], reverse=True)
        self.statistics['selected_features'] = [idx for idx, _ in variances[:target_dimensions]]

    def _apply_feature_selection(self, data: List[DataSample]) -> List[DataSample]:
        """Apply feature selection"""
        selected_features = self.statistics.get('selected_features', [])
        return [
            DataSample(
                features=[sample.features[i] for i in selected_features],
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            )
            for sample in data
        ]

    def _apply_autoencoder_reduction(self, data: List[DataSample]) -> List[DataSample]:
        """Placeholder for autoencoder-based reduction"""
        return data

    def _apply_encoding(self, data: List[DataSample]) -> List[DataSample]:
        """Apply quantum-specific encoding"""
        encoding = self.config.encoding

        if encoding == 'angle':
            return self._apply_angle_encoding(data)
        elif encoding == 'amplitude':
            return self._apply_amplitude_encoding(data)
        elif encoding == 'basis':
            return self._apply_basis_encoding(data)

        return data

    def _apply_angle_encoding(self, data: List[DataSample]) -> List[DataSample]:
        """Encode features as rotation angles for quantum gates"""
        return [
            DataSample(
                features=[
                    ((feature + 1) * math.pi) - math.pi  # Normalize to [-π, π] range
                    for feature in sample.features
                ],
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            )
            for sample in data
        ]

    def _apply_amplitude_encoding(self, data: List[DataSample]) -> List[DataSample]:
        """Encode features as amplitudes"""
        return [
            DataSample(
                features=[
                    max(0.0, min(1.0, (feature + 1) / 2))  # Normalize to [0, 1]
                    for feature in sample.features
                ],
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            )
            for sample in data
        ]

    def _apply_basis_encoding(self, data: List[DataSample]) -> List[DataSample]:
        """Encode features in computational basis"""
        return [
            DataSample(
                features=[1.0 if feature > 0 else 0.0 for feature in sample.features],
                label=sample.label,
                target=sample.target,
                metadata=sample.metadata
            )
            for sample in data
        ]

    def _augment_sample(self, sample: DataSample) -> DataSample:
        """Augment a single sample"""
        noise = self.config.augmentation['noise']
        rotations = self.config.augmentation['rotations']
        permutations = self.config.augmentation['permutations']

        augmented_features = sample.features.copy()

        # Add noise
        if noise > 0:
            augmented_features = [
                f + (random.random() - 0.5) * noise
                for f in augmented_features
            ]

        # Apply rotations (for 2D data)
        if rotations and len(augmented_features) >= 2:
            angle = (random.random() - 0.5) * math.pi / 4  # Small rotations
            cos_a = math.cos(angle)
            sin_a = math.sin(angle)

            x = augmented_features[0] * cos_a - augmented_features[1] * sin_a
            y = augmented_features[0] * sin_a + augmented_features[1] * cos_a

            augmented_features[0] = x
            augmented_features[1] = y

        # Apply feature permutations
        if permutations and random.random() < 0.3:
            indices = list(range(len(augmented_features)))
            random.shuffle(indices)
            augmented_features = [augmented_features[i] for i in indices]

        return DataSample(
            features=augmented_features,
            label=sample.label,
            target=sample.target,
            metadata={
                **(sample.metadata or {}),
                'augmented': True
            }
        )

    def _stratified_split(self, data: List[DataSample], train_split: float) -> Tuple[List[DataSample], List[DataSample]]:
        """Perform stratified split by labels"""
        # Group by labels
        label_groups: Dict[int, List[DataSample]] = {}

        for sample in data:
            label = sample.label or 0
            if label not in label_groups:
                label_groups[label] = []
            label_groups[label].append(sample)

        train_data = []
        validation_data = []

        # Split each group proportionally
        for group in label_groups.values():
            split_index = int(len(group) * train_split)
            train_data.extend(group[:split_index])
            validation_data.extend(group[split_index:])

        return train_data, validation_data

    def get_statistics(self) -> Dict[str, List[float]]:
        """Get preprocessing statistics"""
        return self.statistics.copy()

    def export_config(self) -> Dict[str, Any]:
        """Export configuration"""
        return {
            'normalization': self.config.normalization,
            'encoding': self.config.encoding,
            'dimensionality': self.config.dimensionality,
            'augmentation': self.config.augmentation,
            'validation': self.config.validation
        }

    def import_config(self, config: Dict[str, Any]) -> None:
        """Import configuration"""
        self.config = PreprocessingConfig(**config)


# Utility functions for common preprocessing tasks

def standardize_features(data: List[DataSample]) -> List[DataSample]:
    """Apply z-score standardization"""
    preprocessor = QuantumDataPreprocessor({'normalization': 'zscore'})
    return preprocessor.fit_transform(data)


def normalize_features(data: List[DataSample], method: str = 'zscore') -> List[DataSample]:
    """Apply normalization with specified method"""
    preprocessor = QuantumDataPreprocessor({'normalization': method})
    return preprocessor.fit_transform(data)


def encode_for_quantum(data: List[DataSample], encoding: str = 'angle') -> List[DataSample]:
    """Apply quantum-specific encoding"""
    preprocessor = QuantumDataPreprocessor({'encoding': encoding})
    return preprocessor.fit_transform(data)


def reduce_dimensionality(data: List[DataSample], method: str, target_dims: int) -> List[DataSample]:
    """Apply dimensionality reduction"""
    preprocessor = QuantumDataPreprocessor({
        'dimensionality': {
            'reduction': method,
            'target_dimensions': target_dims
        }
    })
    return preprocessor.fit_transform(data)


def create_train_validation_split(
    data: List[DataSample],
    train_split: float = 0.8,
    stratify: bool = True
) -> Tuple[List[DataSample], List[DataSample]]:
    """Create train/validation split"""
    preprocessor = QuantumDataPreprocessor({
        'validation': {
            'train_split': train_split,
            'stratify': stratify,
            'shuffle': True
        }
    })
    return preprocessor.split_data(data)


# Quantum-specific data analysis functions

def analyze_quantum_readiness(data: List[DataSample]) -> Dict[str, Any]:
    """Analyze data for quantum ML compatibility"""
    features = [sample.features for sample in data]
    num_features = len(features[0]) if features else 0
    num_samples = len(features)

    # Calculate feature correlations
    correlations = [[0.0 for _ in range(num_features)] for _ in range(num_features)]

    for i in range(num_features):
        for j in range(num_features):
            correlation = sum(f[i] * f[j] for f in features) / num_samples
            correlations[i][j] = correlation

    # Assess quantum compatibility
    recommendations = []
    quantum_compatible = True

    # Check feature count vs qubit availability
    if num_features > 20:
        recommendations.append('Consider dimensionality reduction - high feature count may exceed practical qubit limits')
        quantum_compatible = False

    # Check for highly correlated features
    high_correlation_count = 0
    for i in range(num_features):
        for j in range(i + 1, num_features):
            if abs(correlations[i][j]) > 0.8:
                high_correlation_count += 1

    if high_correlation_count > num_features:
        recommendations.append('High feature correlations detected - consider feature selection or quantum kernel methods')

    # Check data distribution
    feature_ranges = []
    for i in range(num_features):
        values = [f[i] for f in features]
        feature_range = max(values) - min(values)
        feature_ranges.append(feature_range)

    if any(r < 0.1 for r in feature_ranges):
        recommendations.append('Some features have very small ranges - consider normalization')

    return {
        'quantum_compatible': quantum_compatible,
        'recommendations': recommendations,
        'statistics': {
            'feature_correlations': correlations,
            'quantum_state_fidelity': 0.85,  # Placeholder
            'encoding_efficiency': min(1.0, 10 / num_features) if num_features > 0 else 0
        }
    }
from __future__ import annotations

from tensorflow.keras import applications, layers, models, regularizers


def build_custom_cnn(input_shape: tuple[int, int, int] = (224, 224, 1)):
    """Create a custom CNN model for binary chest X-ray classification."""
    model = models.Sequential(
        [
            layers.Input(shape=input_shape),

            layers.Conv2D(
                16,
                (3, 3),
                activation="relu",
                padding="same",
                kernel_regularizer=regularizers.l2(1e-4),
            ),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.1),

            layers.Conv2D(
                32,
                (3, 3),
                activation="relu",
                padding="same",
                kernel_regularizer=regularizers.l2(1e-4),
            ),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.15),

            layers.Conv2D(
                64,
                (3, 3),
                activation="relu",
                padding="same",
                kernel_regularizer=regularizers.l2(1e-4),
            ),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.2),

            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.3),
            layers.Dense(64, activation="relu"),
            layers.Dropout(0.3),
            layers.Dense(1, activation="sigmoid"),
        ]
    )
    return model


def build_transfer_learning_model(input_shape: tuple[int, int, int] = (192, 192, 3)):
    """Build a compact MobileNetV3Small transfer learning model."""
    base_model = applications.MobileNetV3Small(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
    )

    base_model.trainable = False

    inputs = layers.Input(shape=input_shape)
    x = applications.mobilenet_v3.preprocess_input(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(64, activation="relu", kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="mobilenetv3_small_xray")

    return model, base_model

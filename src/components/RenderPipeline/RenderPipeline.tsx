import { useStore } from "@/src/types/StoreContext";
import { observer } from "mobx-react-lite";
import { WebGLRenderTarget } from "three";
import { RenderPipelineV1 } from "./RenderPipelineV1";
import { RenderPipelineV2 } from "./RenderPipelineV2";

type Props = {
  renderTargetZ: WebGLRenderTarget;
};

export const RenderPipeline = observer(function RenderPipeline(props: Props) {
  const store = useStore();

  if (store.version === 1) {
    return <RenderPipelineV1 {...props} />;
  } else {
    return <RenderPipelineV2 {...props} />;
  }
});

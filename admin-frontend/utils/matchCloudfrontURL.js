import { cloudFrontURL } from "./videoAPIutil"

export const matchCloudfrontURL=(url)=>{
    const temp=url.split("/")
    const foundMatch=temp.find(
        (item) =>
          item ===
          cloudFrontURL.split("/")[cloudFrontURL.split("/").length - 1]
      )
    return !!foundMatch;
}